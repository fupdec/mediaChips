import type { ApiDb, MediaLike } from '../../api/types/db'
import type {
  AppWebSocket,
  ExpressWithWs,
  MoveFilesWsMessage,
  MovingWsMessage,
  PreparedMoveItem,
  RenameFileWsMessage,
  WatchedFolderEntry,
  WatcherExtensionsMap,
  WatcherFolderReport,
  WatcherWsMessage,
  WsOutboundPayload,
} from '../types/websockets'
import { errorMessage, asMoveError } from '../types/websockets'
import type { Request } from 'express'
import type { Express } from 'express'
const path = require("path");
const _ = require("lodash");
const chokidar = require("chokidar");
const fs = require('fs').promises;
const {isPathInsideFolder, pathsEquivalent} = require('../../api/utils/normalizeUserPath');

const pathsMatch = (left: string, right: string) => pathsEquivalent(left, right)

module.exports = function (app: Express, db: ApiDb) {
  require('express-ws')(app)
  const wsApp = app as ExpressWithWs
  // file watcher
  wsApp.ws('/watcher', (ws: AppWebSocket, req: Request) => {
    console.log('New WebSocket connection');

    let watcher: ReturnType<typeof chokidar.watch> | null = null;
    let watchedFolders: WatchedFolderEntry[] = [];
    let filesList: WatcherFolderReport[] = [];

    // Флаг для предотвращения многократной обработки
    let isProcessing = false;
    let pendingRefresh = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    // Рекурсивная функция для поиска файлов
    const findFilesRecursive = async (dir: string, extensions: string[], depth = 0, maxDepth = 10, allFiles: string[] = []) => {
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
          } catch (statError: unknown) {
            console.error(`Error accessing ${filePath}:`, errorMessage(statError));
          }
        }
      } catch (readdirError: unknown) {
        console.error(`Error reading directory ${dir}:`, errorMessage(readdirError));
      }

      return allFiles;
    };

    const getFilesList = async () => {
      if (!watcher) {
        return;
      }

      if (isProcessing) {
        pendingRefresh = true;
        return;
      }

      isProcessing = true;
      pendingRefresh = false;

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
              const extensions = t.extensions.split(',').map((ext: string) => ext.trim().toLowerCase()).filter(Boolean)

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
                .filter((row: MediaLike) => row.path && isPathInsideFolder(String(row.path), folderPath))
                .map((row: MediaLike) => ({path: String(row.path), id: row.id}));

              console.log(`Found ${filesInDb.length} files in database for folder ${folderPath}`);

              // Логируем первые несколько файлов из БД для отладки
              if (filesInDb.length > 0) {
                console.log('First 5 files from DB:', filesInDb.slice(0, 5).map((f) => f.path));
              }

              // Находим потерянные файлы (в БД, но не в файловой системе)
              const lostFiles = filesInDb
                .filter((entry) => !filesInFolder.some((fsPath) => pathsMatch(entry.path, fsPath)))
                .sort((a, b) => a.path.localeCompare(b.path));

              console.log(`Lost files: ${lostFiles.length}`);

              // Находим новые файлы (в файловой системе, но не в БД)
              const newFiles = filesInFolder
                .filter((filePath) => !filesInDb.some((dbFile) => pathsMatch(dbFile.path, filePath)))
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
            } catch (error: unknown) {
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
      } catch (error: unknown) {
        console.error('Error in getFilesList:', error);
      } finally {
        isProcessing = false;
        if (pendingRefresh) {
          pendingRefresh = false;
          debouncedGetFilesList();
        }
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

    const startWatcher = (folders: WatchedFolderEntry[], extensions: WatcherExtensionsMap) => {
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
        .on('add', (filePath: string) => {
          console.log('File added:', filePath);
          debouncedGetFilesList();
        })
        .on('change', (filePath: string) => {
          console.log('File changed:', filePath);
          debouncedGetFilesList();
        })
        .on('unlink', (filePath: string) => {
          console.log('File removed:', filePath);
          debouncedGetFilesList();
        })
        .on('ready', async () => {
          console.log('Watcher ready, getting initial file list');
          await getFilesList();
        })
        .on('error', (error: unknown) => {
          console.error('Watcher error:', error);
        });
    };

    const updateWatcher = (folders: WatchedFolderEntry[], extensions: WatcherExtensionsMap) => {
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

    ws.on('message', async (rawMsg: unknown) => {
      try {
        const data = JSON.parse(String(rawMsg)) as WatcherWsMessage;
        console.log('Received message type:', data.type);

        switch (data.type) {
          case 'start':
            watchedFolders = data.folders || [];
            console.log('Starting with folders:', watchedFolders.map((f) => f.path));
            console.log('Extensions:', JSON.stringify(data.extensions, null, 2));
            startWatcher(watchedFolders, data.extensions || {});
            break;

          case 'update':
            watchedFolders = data.folders || [];
            console.log('Updating with folders:', watchedFolders.map((f) => f.path));
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
      } catch (error: unknown) {
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

    ws.on('error', (error: unknown) => {
      console.error('WebSocket error:', error);
    });
  });

// moving files
  wsApp.ws('/moving', (ws: AppWebSocket, req: Request) => {
    const {
      moveFile,
      prepareMoveItems,
      prepareRename,
      checkBatchDiskSpace,
      checkRenameDiskSpace,
      estimateSeconds,
    } = require('./moveFile')

    const send = (payload: WsOutboundPayload) => {
      if (ws.readyState === 1) ws.send(JSON.stringify(payload))
    }

    const moveFiles = async (msg: MoveFilesWsMessage) => {
      const items = Array.isArray(msg.items) && msg.items.length
        ? msg.items
        : (msg.ids || []).map((id) => ({ id, folder: String(msg.folder || '') }))

      if (!items.length) {
        send({ type: 'close', moved: 0, failed: 0, total: 0 })
        return
      }

      const { prepared, totalBytes, bytesNeedingCopy } = await prepareMoveItems(db, items)
      const validItems = prepared.filter((item: PreparedMoveItem) => !item.error)
      const preErrors = prepared.filter((item: PreparedMoveItem) => item.error)

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
          await moveFile(item.oldPath, item.newPath, (transferred: number, size: number) => {
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

          try {
            await db.Media.update({ path: item.newPath }, { where: { id: item.id } })
          } catch (dbError: unknown) {
            try {
              await moveFile(item.newPath, item.oldPath)
            } catch (rollbackError: unknown) {
              console.error(`Rollback failed for ${item.fileName}:`, errorMessage(rollbackError))
            }

            failed += 1
            console.error(`Error updating database for ${item.fileName}:`, errorMessage(dbError))
            send({
              type: 'error',
              id: item.id,
              fileName: item.fileName,
              folder: item.folder,
              code: 'DB_UPDATE',
              message: errorMessage(dbError),
            })
            continue
          }

          moved += 1

          send({
            type: 'success',
            id: item.id,
            fileName: item.fileName,
            folder: item.folder,
            newPath: item.newPath,
          })
        } catch (error: unknown) {
          failed += 1
          const moveError = asMoveError(error)
          console.error(`Error moving file ${item.fileName}:`, moveError.message)

          send({
            type: 'error',
            id: item.id,
            fileName: item.fileName,
            folder: item.folder,
            code: moveError.code || 'UNKNOWN',
            required: moveError.required,
            available: moveError.available,
            message: moveError.message,
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

    const renameFileOnDisk = async (msg: RenameFileWsMessage) => {
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
          await moveFile(prepared.oldPath, prepared.newPath, (transferred: number, size: number) => {
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
        } catch (error: unknown) {
          failed = 1
          const moveError = asMoveError(error)
          console.error(`Error renaming file ${prepared.fileName}:`, moveError.message)
          send({
            type: 'error',
            fileName: prepared.fileName,
            folder: prepared.folder,
            code: moveError.code || 'UNKNOWN',
            required: moveError.required,
            available: moveError.available,
            message: moveError.message,
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

    ws.on('message', async (rawMsg: unknown) => {
      try {
        const parsed = JSON.parse(String(rawMsg)) as MovingWsMessage
        switch (parsed.type) {
          case 'move':
            await moveFiles(parsed)
            break
          case 'rename':
            await renameFileOnDisk(parsed)
            break
        }
      } catch (error: unknown) {
        console.error('Moving WebSocket error:', error)
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ type: 'close', moved: 0, failed: 0, total: 0, error: true }))
        }
      }
    })
  })
}