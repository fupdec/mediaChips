import type { ServerConfig, ServerDatabaseEntry, NetworkIpInfo, NetworkHelpers } from '../types/server'
import { apiErrorMessage, apiErrorStack } from '../../api/types/errors'
const path = require('path')
const fs = require('fs')
const os = require('os')
const {FIXED_PORT, ALLOW_LAN} = require('./constants')

function initializeServerConfig({getBestLocalIp, getAllIps}: NetworkHelpers) {
  let app_folder
  const is_electron_running = process.versions.electron

  if (is_electron_running) {
    app_folder = process.env.PORTABLE_EXECUTABLE_DIR || process.electron_app!.getPath('userData')
    process.app_folder = app_folder

    const oldDbPath = path.join(app_folder, 'databases')
    const newDbPath = path.join(app_folder, 'app_storage')

    if (fs.existsSync(oldDbPath)) {
      try {
        fs.renameSync(oldDbPath, newDbPath)
        console.log('Data successfully preserved and moved to app_storage')
      } catch (err: unknown) {
        console.error('Error while preserving data:', err)
      }
    }
  }

  let configPath
  if (is_electron_running) {
    configPath = path.join(app_folder, '/config.json')
  } else {
    configPath = path.join(__dirname, '../../public/config.json')
  }

  console.log('\x1b[33m%s\x1b[0m', '=== SERVER SETUP ===')

  let config
  try {
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      console.log('\x1b[33m%s\x1b[0m', `Config loaded from ${configPath}`)
    } else {
      throw new Error('Config file not found')
    }
  } catch (e: unknown) {
    console.log('\x1b[33m%s\x1b[0m', 'Creating new config...')
    config = {
      port: FIXED_PORT,
      databases: [{
        id: Date.now().toString(16),
        name: 'Default',
        active: true,
        createdAt: Date.now(),
      }],
    }
  }

  const allIpsInfo = getAllIps()
  const bestIp = getBestLocalIp()

  config.ip = ALLOW_LAN ? bestIp : 'localhost'
  config.ips = ALLOW_LAN ? allIpsInfo.map((ip: NetworkIpInfo) => ip.address) : []
  config.hostname = ALLOW_LAN ? os.hostname() : 'localhost'
  config.port = FIXED_PORT

  const activeDb = config.databases.find((db: ServerDatabaseEntry) => db.active)
  if (!activeDb) {
    console.error('\x1b[31m%s\x1b[0m', '❌ No active database!')
    if (config.databases.length > 0) {
      config.databases[0].active = true
      console.log('\x1b[33m%s\x1b[0m', `Activated first database: ${config.databases[0].name}`)
    }
  }

  const configDir = path.dirname(configPath)
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, {recursive: true})
  }

  let databasesPath
  if (is_electron_running) {
    databasesPath = path.join(app_folder, '/app_storage')
  } else {
    databasesPath = path.join(__dirname, '../../app_storage')
  }

  const currentActiveDb = config.databases.find((db: ServerDatabaseEntry) => db.active)
  if (currentActiveDb) {
    config.path = path.join(databasesPath, currentActiveDb.id)
    console.log('\x1b[36m%s\x1b[0m', `Active database: ${currentActiveDb.name} (${currentActiveDb.id})`)
    console.log('\x1b[36m%s\x1b[0m', `Database path: ${config.path}`)
  } else {
    console.error('\x1b[31m%s\x1b[0m', '❌ Failed to determine active database')
    config.path = path.join(databasesPath, config.databases[0]?.id || 'default')
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  console.log('\x1b[32m%s\x1b[0m', `✅ Config saved. Primary IP: ${bestIp}, Port: ${FIXED_PORT}`)

  createStorageDirectories(config, databasesPath)

  return {
    config,
    configPath,
    databasesPath,
    app_folder,
    is_electron_running,
    bestIp,
    allIpsInfo,
  }
}

function createStorageDirectories(config: ServerConfig, databasesPath: string) {
  let userDirs = [databasesPath]

  for (const db of config.databases) {
    const dbPath = path.join(databasesPath, db.id)
    const mediaPath = path.join(dbPath, 'media')
    const metaPath = path.join(dbPath, 'meta')
    const backupPath = path.join(dbPath, 'backups')
    const videoPath = path.join(mediaPath, 'videos')
    const imagePath = path.join(mediaPath, 'images')
    const audioPath = path.join(mediaPath, 'audios')
    const textPath = path.join(mediaPath, 'texts')

    const videoSubDirs = ['thumbs', 'marks', 'grids', 'timelines'].map(subDir =>
      path.join(videoPath, subDir),
    )

    userDirs = [...userDirs, dbPath, mediaPath, metaPath, backupPath,
      videoPath, imagePath, audioPath, textPath, ...videoSubDirs]
  }

  for (const dir of userDirs) {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, {recursive: true})
      } catch (err: unknown) {
        console.log('\x1b[31m%s\x1b[0m', `❌ Error creating directory ${dir}:`, err instanceof Error ? apiErrorMessage(err) : String(err))
      }
    }
  }
}

module.exports = {
  initializeServerConfig,
  createStorageDirectories,
}
