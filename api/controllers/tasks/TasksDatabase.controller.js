const fs = require('fs')
const path = require('path')
const {rimraf} = require('rimraf')
const {readdir, stat} = require('fs/promises')
const {machineId} = require('node-machine-id')
const {getAppConfigPath} = require('../../utils/appConfigPath')

module.exports = function createTasksDatabaseController(shared) {
  const {db, resolveGeneratedFolderPath} = shared

  const rmrf = (folder) => rimraf(folder)

  const deleteDb = async function (req, res) {
    const dbDir = path.join(db.path_databases, req.body.id)
    try {
      await rmrf(dbDir)
      res.status(201).send('successfully deleted')
    } catch (err) {
      res.status(400).send(err)
    }
  }

  const getDirectorySize = async (directory) => {
    if (!fs.existsSync(directory)) return 0

    const entries = await readdir(directory, {withFileTypes: true})
    const sizes = await Promise.all(entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) return getDirectorySize(entryPath)
      if (entry.isFile()) {
        const {size} = await stat(entryPath)
        return size
      }
      return 0
    }))

    return sizes.reduce((sum, size) => sum + size, 0)
  }

  const getDatabaseSizes = async function (req, res) {
    const ids = req.body?.ids
    if (!Array.isArray(ids) || !ids.length) {
      res.status(400).send({message: 'ids array is required'})
      return
    }

    try {
      const sizes = {}
      await Promise.all(ids.map(async (id) => {
        const dbDir = path.join(db.path_databases, id)
        sizes[id] = await getDirectorySize(dbDir)
      }))
      res.status(201).send({sizes})
    } catch (err) {
      res.status(400).send({message: err.message || String(err)})
    }
  }

  const getFolderSize = async function (req, res) {
    const dirPath = resolveGeneratedFolderPath(req.body.folder)
    if (!dirPath) {
      res.status(400).send({message: 'Unknown folder type'})
      return
    }

    const dirSize = async (directory) => {
      if (!fs.existsSync(directory)) return 0

      const files = await readdir(directory)
      const stats = files.map(file => stat(path.join(directory, file)))

      return (await Promise.all(stats)).reduce((accumulator, {size}) => accumulator + size, 0)
    }

    const size = await dirSize(dirPath)
    res.status(201).send({size})
  }

  const clearData = async function (req, res) {
    const imageType = req.body.imageType
    const delPath = resolveGeneratedFolderPath(imageType)

    if (!delPath) {
      res.status(400).send({message: 'Unknown folder type'})
      return
    }

    try {
      await rmrf(delPath)
      if (!fs.existsSync(delPath)) fs.mkdirSync(delPath, {recursive: true})
      res.sendStatus(201)
    } catch (err) {
      res.status(400).send(err)
    }
  }

  const getConfig = async (req, res) => {
    try {
      const configPath = getAppConfigPath()
      const config_json = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      res.status(200).json(config_json)
    } catch (error) {
      res.status(500).json({message: error.message || 'Failed to read config'})
    }
  }

  const getMachineId = async function (req, res) {
    try {
      const id = await machineId()
      res.status(200).send(id)
    } catch (error) {
      console.error('getMachineId failed:', error)
      res.status(500).send({message: 'Failed to get machine id'})
    }
  }

  return {
    deleteDb,
    getDatabaseSizes,
    getFolderSize,
    clearData,
    getConfig,
    getMachineId,
  }
}
