const path = require('path')
const {exec} = require('child_process')
const {readdir, lstat} = require('fs/promises')
const {resolveExistingPath} = require('../../services/contentHash')
const {normalizeMediaPath} = require('../../utils/normalizeUserPath')
const {unlinkResolvedPath} = require('../../services/localAssetCleanup')

module.exports = function createTasksFileController(shared) {
  const checkFileExists = async function (req, res) {
    const filePath = normalizeMediaPath(req.body.path)
    const resolved = filePath ? await resolveExistingPath(filePath) : null
    if (resolved) res.sendStatus(201)
    else res.sendStatus(400)
  }

  const renameFile = async function (req, res) {
    const { old_path, new_path } = req.body
    const { moveFile, prepareRename, checkRenameDiskSpace } = require('../../../app/tasks/moveFile')

    try {
      const prepared = await prepareRename(old_path, new_path)

      if (prepared.error) {
        return res.status(400).send({
          code: prepared.error.code,
          fileName: prepared.fileName,
          folder: prepared.folder,
        })
      }

      if (prepared.skip) {
        return res.sendStatus(201)
      }

      const diskSpaceError = await checkRenameDiskSpace(prepared)
      if (diskSpaceError) {
        return res.status(400).send({
          code: 'NO_SPACE',
          required: diskSpaceError.required,
          available: diskSpaceError.available,
          fileName: prepared.fileName,
          folder: prepared.folder,
        })
      }

      await moveFile(old_path, new_path)
      res.sendStatus(201)
    } catch (error) {
      console.log('ERROR: ' + error.message)
      res.status(400).send({
        code: error.code || 'UNKNOWN',
        message: error.message,
        required: error.required,
        available: error.available,
        fileName: path.basename(new_path),
        folder: path.dirname(new_path),
      })
    }
  }

  const openPath = async function (req, res) {
    let entryPath = path.normalize(req.body.path)
    if (req.body.isDir) entryPath = path.dirname(entryPath)

    const fail = (message) => res.status(400).send({message})

    try {
      const {shell} = require('electron')
      const error = await shell.openPath(entryPath)
      if (error) return fail(error)
      return res.sendStatus(201)
    } catch (_) {
      // Non-Electron environment (e.g. standalone API dev server)
    }

    const command = process.platform === 'darwin'
      ? `open ${JSON.stringify(entryPath)}`
      : process.platform === 'win32'
        ? `start "" ${JSON.stringify(entryPath)}`
        : `xdg-open ${JSON.stringify(entryPath)}`

    exec(command, (err) => {
      if (err) return fail(err.message)
      res.sendStatus(201)
    })
  }

  const getFileList = async function (req, res) {
    async function findInDir(rootDir, regex, excluded) {
      const fileList = []
      const stack = [rootDir]
      let scanned = 0

      while (stack.length) {
        const dir = stack.pop()
        let files

        try {
          files = await readdir(dir, {withFileTypes: true})
        } catch (err) {
          continue
        }

        for (const file of files) {
          const filePath = path.join(dir, file.name)

          if (excluded.some(exclude => filePath.includes(exclude))) {
            continue
          }

          if (file.isDirectory()) {
            stack.push(filePath)
          } else if (file.isFile() && regex.test(filePath.toLowerCase())) {
            fileList.push(filePath)
          }

          scanned += 1
          if (scanned % 500 === 0) {
            await new Promise(resolve => setImmediate(resolve))
          }
        }
      }

      return fileList
    }

    const entryPath = path.join(req.body.path);
    const regexObj = JSON.parse(req.body.filter);
    const excluded = Array.isArray(req.body.excluded) ? req.body.excluded : [];
    const regex = new RegExp(regexObj);

    let fileStat
    try {
      fileStat = await lstat(entryPath)
    } catch (error) {
      res.status(400).send({
        message: error
      })
      return
    }

    if (fileStat.isFile() && regex.test(entryPath.toLowerCase())) {
      res.status(201).send([entryPath])
      return
    } else if (!fileStat.isDirectory()) {
      res.status(400).send({
        message: "not directory"
      })
      return
    }

    let fileList = await findInDir(entryPath, regex, excluded)
    res.status(201).send(fileList)
  }

  const deleteFile = async function (req, res) {
    try {
      const deleted = await unlinkResolvedPath(req.body.path)

      if (!deleted) {
        return res.status(404).send({
          message: 'File not found.',
        })
      }

      res.status(201).send({
        message: 'successfully deleted local file',
      })
    } catch (err) {
      res.status(400).send(err)
    }
  }

  return {
    checkFileExists,
    renameFile,
    openPath,
    getFileList,
    deleteFile,
  }
}
