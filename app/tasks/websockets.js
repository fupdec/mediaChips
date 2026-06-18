const path = require("path");
const _ = require("lodash");
const chokidar = require("chokidar");
const fs = require('fs').promises;

module.exports = function (app, db) {
  const expressWs = require('express-ws')(app)
  // file watcher
  app.ws('/watcher', (ws, req) => {
    console.log('New WebSocket connection');

    let watcher = null;
    let watchedFolders = [];
    let filesList = [];

    // Флаг для предотвращения многократной обработки
    let isProcessing = false;
    let debounceTimer = null;

    // Рекурсивная функция для поиска файлов
    const findFilesRecursive = async (dir, extensions, depth = 0, maxDepth = 10, allFiles = []) => {
      if (depth > maxDepth) {
        return allFiles;
      }

      try {
        const files = await fs.readdir(dir);

        for (const file of files) {
          const filePath = path.join(dir, file);

          try {
            const stat = await fs.stat(filePath);

            if (stat.isDirectory()) {
              // Рекурсивно ищем в поддиректориях с увеличением глубины
              await findFilesRecursive(filePath, extensions, depth + 1, maxDepth, allFiles);
            } else if (stat.isFile()) {
              const fileExt = path.extname(file).toLowerCase().slice(1);

              if (extensions.length === 0 || extensions.includes(fileExt)) {
                allFiles.push(filePath);
              }
            }
          } catch (statError) {
            console.error(`Error accessing ${filePath}:`, statError.message);
          }
        }
      } catch (readdirError) {
        console.error(`Error reading directory ${dir}:`, readdirError.message);
      }

      return allFiles;
    };

    const getFilesList = async () => {
      if (!watcher || isProcessing) {
        return;
      }

      isProcessing = true;

      try {
        console.log('Getting files list for folders:', watchedFolders.map(f => f.path));

        const newFilesList = [];

        // Обрабатываем каждую отслеживаемую папку
        for (let folder of watchedFolders) {
          const types = folder.types || [];
          const folderPath = folder.path;
          let filesByType = [];

          console.log(`Processing folder: ${folderPath}`);

          for (let t of types) {
            try {
              // Получаем медиа из базы данных
              const media = await db.Media.findAll({
                where: {
                  mediaTypeId: t.id
                },
                raw: true,
              });

              // Получаем расширения для этого типа
              const extensions = t.extensions.split(',').map(ext => ext.trim().toLowerCase()).filter(ext => ext);

              console.log(`Looking for files with extensions: ${extensions.join(', ')} in ${folderPath}`);

              // Ищем файлы в файловой системе рекурсивно
              const filesInFolder = await findFilesRecursive(folderPath, extensions);

              console.log(`Found ${filesInFolder.length} files in filesystem for folder ${folderPath}`);

              // Логируем первые несколько файлов для отладки
              if (filesInFolder.length > 0) {
                console.log('First 5 files found:', filesInFolder.slice(0, 5));
              }

              // Получаем файлы из базы данных для этой папки
              const filesInDb = media
                .filter(x => x.path && x.path.includes(folderPath))
                .map(x => ({path: x.path, id: x.id}));

              console.log(`Found ${filesInDb.length} files in database for folder ${folderPath}`);

              // Логируем первые несколько файлов из БД для отладки
              if (filesInDb.length > 0) {
                console.log('First 5 files from DB:', filesInDb.slice(0, 5).map(f => f.path));
              }

              // Находим потерянные файлы (в БД, но не в файловой системе)
              const lostFiles = filesInDb
                .filter(x => !filesInFolder.includes(x.path))
                .sort((a, b) => a.path.localeCompare(b.path));

              console.log(`Lost files: ${lostFiles.length}`);

              // Находим новые файлы (в файловой системе, но не в БД)
              const newFiles = filesInFolder
                .filter(x => !filesInDb.some(dbFile => dbFile.path === x))
                .sort((a, b) => a.localeCompare(b));

              console.log(`New files: ${newFiles.length}`);

              // Логируем первые несколько новых файлов для отладки
              if (newFiles.length > 0) {
                console.log('First 5 new files:', newFiles.slice(0, 5));
              }

              filesByType.push({
                type: t,
                lost: lostFiles,
                new: newFiles
              });
            } catch (error) {
              console.error(`Error processing type ${t.id}:`, error);
            }
          }

          if (filesByType.length > 0) {
            newFilesList.push({
              folder: folder,
              files: filesByType,
            });
          }
        }

        filesList = newFilesList;

        // Отправляем результат клиенту
        if (ws.readyState === 1) { // WebSocket.OPEN
          const response = {
            type: 'files',
            data: filesList,
          };
          console.log(`Sending response with ${filesList.length} folders`);
          ws.send(JSON.stringify(response));
        }
      } catch (error) {
        console.error('Error in getFilesList:', error);
      } finally {
        isProcessing = false;
      }
    };

    // Debounced версия getFilesList
    const debouncedGetFilesList = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        getFilesList();
      }, 500); // 500ms debounce
    };

    const startWatcher = (folders, extensions) => {
      // Закрываем существующий watcher если есть
      if (watcher) {
        watcher.close();
        watcher = null;
      }

      // Создаем маски для отслеживания
      const foldersMasked = [];
      for (let folder in extensions) {
        for (let ext of extensions[folder]) {
          foldersMasked.push(path.join(folder, '**', `*.${ext}`));
        }
      }

      console.log('Starting watcher with masks:', foldersMasked);

      // Создаем новый watcher
      watcher = chokidar.watch(foldersMasked, {
        ignoreInitial: true,
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 100
        },
        ignored: /(^|[\/\\])\../, // игнорируем скрытые файлы
        ignorePermissionErrors: true,
        depth: 99 // глубина рекурсивного поиска
      });

      // Обработчики событий с debounce
      watcher
        .on('add', path => {
          console.log('File added:', path);
          debouncedGetFilesList();
        })
        .on('change', path => {
          console.log('File changed:', path);
          debouncedGetFilesList();
        })
        .on('unlink', path => {
          console.log('File removed:', path);
          debouncedGetFilesList();
        })
        .on('ready', async () => {
          console.log('Watcher ready, getting initial file list');
          await getFilesList();
        })
        .on('error', error => {
          console.error('Watcher error:', error);
        });
    };

    const updateWatcher = (folders, extensions) => {
      watchedFolders = folders;

      if (watcher) {
        // Создаем маски для добавления
        const foldersMasked = [];
        for (let folder in extensions) {
          for (let ext of extensions[folder]) {
            foldersMasked.push(path.join(folder, '**', `*.${ext}`));
          }
        }

        console.log('Updating watcher with new masks:', foldersMasked);
        watcher.add(foldersMasked);

        // Ждем немного и обновляем список файлов
        setTimeout(() => {
          getFilesList();
        }, 1000);
      } else {
        // Если watcher не запущен, запускаем его
        startWatcher(folders, extensions);
      }
    };

    ws.on('message', async (msg) => {
      try {
        const data = JSON.parse(msg);
        console.log('Received message type:', data.type);

        switch (data.type) {
          case 'start':
            watchedFolders = data.folders || [];
            console.log('Starting with folders:', watchedFolders.map(f => f.path));
            console.log('Extensions:', JSON.stringify(data.extensions, null, 2));
            startWatcher(watchedFolders, data.extensions || {});
            break;

          case 'update':
            watchedFolders = data.folders || [];
            console.log('Updating with folders:', watchedFolders.map(f => f.path));
            console.log('Extensions:', JSON.stringify(data.extensions, null, 2));
            updateWatcher(watchedFolders, data.extensions || {});
            break;

          case 'stop':
            console.log('Stopping watcher');
            if (watcher) {
              watcher.close();
              watcher = null;
            }
            if (ws.readyState === 1) {
              ws.send(JSON.stringify({
                type: 'closed'
              }));
            }
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      if (watcher) {
        watcher.close();
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

// moving files
  app.ws('/moving', (ws, req) => {
    const {
      moveFile,
      prepareMoveItems,
      prepareRename,
      checkBatchDiskSpace,
      checkRenameDiskSpace,
      estimateSeconds,
    } = require('./moveFile')

    const send = (payload) => {
      if (ws.readyState === 1) ws.send(JSON.stringify(payload))
    }

    const moveFiles = async (msg) => {
      const items = Array.isArray(msg.items) && msg.items.length
        ? msg.items
        : (msg.ids || []).map(id => ({ id, folder: msg.folder }))

      if (!items.length) {
        send({ type: 'close', moved: 0, failed: 0, total: 0 })
        return
      }

      const { prepared, totalBytes, bytesNeedingCopy } = await prepareMoveItems(db, items)
      const validItems = prepared.filter(i => !i.error)
      const preErrors = prepared.filter(i => i.error)

      const diskSpaceError = await checkBatchDiskSpace(prepared, bytesNeedingCopy)
      if (diskSpaceError) {
        send({
          type: 'init',
          total: items.length,
          totalBytes,
          estimatedSeconds: 0,
        })

        for (const item of validItems) {
          send({
            type: 'error',
            id: item.id,
            fileName: item.fileName,
            folder: item.folder,
            code: 'NO_SPACE',
            required: diskSpaceError.required,
            available: diskSpaceError.available,
          })
        }

        for (const item of preErrors) {
          send({
            type: 'error',
            id: item.id,
            fileName: item.fileName,
            folder: item.folder,
            code: item.error.code,
          })
        }

        send({
          type: 'close',
          moved: 0,
          failed: items.length,
          total: items.length,
          totalBytes,
        })
        return
      }

      const estimatedSeconds = estimateSeconds(totalBytes, bytesNeedingCopy)
      send({
        type: 'init',
        total: items.length,
        totalBytes,
        estimatedSeconds,
        preFailed: preErrors.length,
      })

      let moved = 0
      let failed = preErrors.length
      let processed = preErrors.length
      const startedAt = Date.now()
      let bytesCopied = 0

      for (const item of preErrors) {
        send({
          type: 'error',
          id: item.id,
          fileName: item.fileName,
          folder: item.folder,
          code: item.error.code,
        })
      }

      for (const item of validItems) {
        processed += 1

        if (item.skip) {
          bytesCopied += item.size
          moved += 1
          send({
            type: 'success',
            id: item.id,
            fileName: item.fileName,
            folder: item.folder,
            newPath: item.newPath,
            skipped: true,
          })
          continue
        }

        let fileStartBytes = bytesCopied

        try {
          await moveFile(item.oldPath, item.newPath, (transferred, size) => {
            const currentCopied = fileStartBytes + transferred
            const elapsed = (Date.now() - startedAt) / 1000
            const speed = elapsed > 0 ? currentCopied / elapsed : 0
            const remainingBytes = Math.max(0, totalBytes - currentCopied)
            const etaSeconds = speed > 0 ? Math.ceil(remainingBytes / speed) : estimatedSeconds

            send({
              type: 'progress',
              current: processed,
              total: items.length,
              fileName: item.fileName,
              fileProgress: size > 0 ? Math.round((transferred / size) * 100) : 100,
              overallProgress: totalBytes > 0
                ? Math.round((currentCopied / totalBytes) * 100)
                : Math.round((processed / items.length) * 100),
              etaSeconds,
              transferredBytes: currentCopied,
              totalBytes,
            })
          })

          bytesCopied += item.size

          await db.Media.update({ path: item.newPath }, { where: { id: item.id } })
          moved += 1

          send({
            type: 'success',
            id: item.id,
            fileName: item.fileName,
            folder: item.folder,
            newPath: item.newPath,
          })
        } catch (error) {
          failed += 1
          console.error(`Error moving file ${item.fileName}:`, error.message)

          send({
            type: 'error',
            id: item.id,
            fileName: item.fileName,
            folder: item.folder,
            code: error.code || 'UNKNOWN',
            required: error.required,
            available: error.available,
            message: error.message,
          })
        }
      }

      send({
        type: 'close',
        moved,
        failed,
        total: items.length,
        totalBytes,
        elapsedSeconds: Math.ceil((Date.now() - startedAt) / 1000),
      })
    }

    const renameFileOnDisk = async (msg) => {
      const oldPath = msg.old_path
      const newPath = msg.new_path

      if (!oldPath || !newPath) {
        send({ type: 'close', moved: 0, failed: 1, total: 1 })
        return
      }

      const prepared = await prepareRename(oldPath, newPath)

      if (prepared.error) {
        send({
          type: 'init',
          total: 1,
          totalBytes: 0,
          estimatedSeconds: 0,
          preFailed: 1,
        })
        send({
          type: 'error',
          fileName: prepared.fileName,
          folder: prepared.folder,
          code: prepared.error.code,
        })
        send({ type: 'close', moved: 0, failed: 1, total: 1, totalBytes: 0 })
        return
      }

      const totalBytes = prepared.size || 0
      const bytesNeedingCopy = prepared.crossDevice ? totalBytes : 0
      const diskSpaceError = await checkRenameDiskSpace(prepared)

      if (diskSpaceError) {
        send({
          type: 'init',
          total: 1,
          totalBytes,
          estimatedSeconds: 0,
        })
        send({
          type: 'error',
          fileName: prepared.fileName,
          folder: prepared.folder,
          code: 'NO_SPACE',
          required: diskSpaceError.required,
          available: diskSpaceError.available,
        })
        send({ type: 'close', moved: 0, failed: 1, total: 1, totalBytes })
        return
      }

      const estimatedSeconds = estimateSeconds(totalBytes, bytesNeedingCopy)
      send({
        type: 'init',
        total: 1,
        totalBytes,
        estimatedSeconds,
        preFailed: 0,
      })

      const startedAt = Date.now()
      let moved = 0
      let failed = 0

      if (prepared.skip) {
        moved = 1
        send({
          type: 'success',
          fileName: prepared.fileName,
          folder: prepared.folder,
          newPath: prepared.newPath,
          skipped: true,
        })
      } else {
        try {
          await moveFile(prepared.oldPath, prepared.newPath, (transferred, size) => {
            const elapsed = (Date.now() - startedAt) / 1000
            const speed = elapsed > 0 ? transferred / elapsed : 0
            const remainingBytes = Math.max(0, totalBytes - transferred)
            const etaSeconds = speed > 0 ? Math.ceil(remainingBytes / speed) : estimatedSeconds

            send({
              type: 'progress',
              current: 1,
              total: 1,
              fileName: prepared.fileName,
              fileProgress: size > 0 ? Math.round((transferred / size) * 100) : 100,
              overallProgress: totalBytes > 0
                ? Math.round((transferred / totalBytes) * 100)
                : 100,
              etaSeconds,
              transferredBytes: transferred,
              totalBytes,
            })
          })

          moved = 1
          send({
            type: 'success',
            fileName: prepared.fileName,
            folder: prepared.folder,
            newPath: prepared.newPath,
          })
        } catch (error) {
          failed = 1
          console.error(`Error renaming file ${prepared.fileName}:`, error.message)
          send({
            type: 'error',
            fileName: prepared.fileName,
            folder: prepared.folder,
            code: error.code || 'UNKNOWN',
            required: error.required,
            available: error.available,
            message: error.message,
          })
        }
      }

      send({
        type: 'close',
        moved,
        failed,
        total: 1,
        totalBytes,
        elapsedSeconds: Math.ceil((Date.now() - startedAt) / 1000),
      })
    }

    ws.on('message', async (msg) => {
      try {
        msg = JSON.parse(msg)
        switch (msg.type) {
          case 'move':
            await moveFiles(msg)
            break
          case 'rename':
            await renameFileOnDisk(msg)
            break
        }
      } catch (error) {
        console.error('Moving WebSocket error:', error)
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ type: 'close', moved: 0, failed: 0, total: 0, error: true }))
        }
      }
    })
  })
}