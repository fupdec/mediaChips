import type { AnyRecord } from '../../types/db'
import type { Express } from 'express'
import { apiErrorMessage } from '../../types/errors'
import type { ApiRequest, ApiResponse } from '../../types/http'
import type { BackupEntry } from '@shared/api/responses'
import type { ApiDb } from '../../types/db'
const fs = require("fs")
const path = require('path')
const { rimraf } = require("rimraf")
const StreamZip = require('node-stream-zip')
const fse = require("fs-extra");

module.exports = function (app: Express, db: ApiDb) {
  const getDbPath = () => {
    if (!db.path) {
      throw new Error('Database path is not configured')
    }
    return db.path
  }
  const getBackupsPath = () => path.join(getDbPath(), 'backups')

  const createBackup = function (req: ApiRequest, res: ApiResponse) {
    let currentdate = new Date(),
      date = currentdate.getDate(),
      month = currentdate.getMonth() + 1,
      hours = currentdate.getHours(),
      mins = currentdate.getMinutes(),
      secs = currentdate.getSeconds(),
      backupName = currentdate.getFullYear() + "." +
        (month > 9 ? month : '0' + month) + "." +
        (date > 9 ? date : '0' + date) + " " +
        (hours > 9 ? hours : '0' + hours) + "-" +
        (mins > 9 ? mins : '0' + mins) + "-" +
        (secs > 9 ? secs : '0' + secs),
      mediaFiles = path.join(getDbPath(), 'media'),
      metaFiles = path.join(getDbPath(), 'meta'),
      dbFile = path.join(getDbPath(), 'db.sqlite')

    const archiver = require('archiver')
    const archive = archiver('zip')
    const outputPath = path.join(getBackupsPath(), backupName + '.zip')
    const output = fs.createWriteStream(outputPath)
    output.on('close', function () {
      res.sendStatus(201)
    })
    archive.on('error', function () {
      res.sendStatus(500)
    })
    archive.pipe(output)
    // include in archive folders and database file
    archive.directory(mediaFiles, 'media')
    archive.directory(metaFiles, 'meta')
    archive.file(dbFile, {
      name: 'db.sqlite'
    })
    archive.finalize()
  };

  const getBackups = function (req: ApiRequest, res: ApiResponse) {
    const backups: BackupEntry[] = []
    const backupsPath = getBackupsPath()
    if (!fs.existsSync(backupsPath)) {
      res.status(201).send(backups)
      return
    }
    fs.readdirSync(backupsPath).forEach((file: unknown) => {
      if (path.extname(file) !== '.zip') return false
      const pathToFile = path.join(backupsPath, file)
      const filestats = fs.statSync(pathToFile)
      let info: BackupEntry = {
        date: path.parse(file).name,
        size: (filestats.size / 1024 / 1024).toFixed(2)
      }
      backups.push(info)
    })
    res.status(201).send(backups)
  };

  const deleteBackup = function (req: ApiRequest, res: ApiResponse) {
    const backupPath = path.join(getBackupsPath(), req.body.name + '.zip')
    fs.unlink(backupPath, (err: unknown) => {
      if (err) {
        console.log(err)
        res.sendStatus(500)
      } else res.sendStatus(201)
    })
  };

  const restoreBackup = async (req: ApiRequest, res: ApiResponse) => {
    const dbPath = getDbPath()
    const backupPath = path.join(getBackupsPath(), req.body.name + '.zip')
    const dbFile = path.join(dbPath, 'db.sqlite')
    const mediaFiles = path.join(dbPath, 'media')
    const metaFiles = path.join(dbPath, 'meta')
    const zip = new StreamZip.async({
      file: backupPath
    })

    const checkLowDbBackup = () => {
      return new Promise(async (resolve: (value?: unknown) => void, reject: (reason?: unknown) => void) => {
        try {
          const entries = await zip.entries();
          let is_low_db = false;
          for (const entry of Object.values(entries) as Array<{name: string}>) {
            if (entry.name === 'dbs.json') {
              is_low_db = true;
              break
            }
          }
          resolve(is_low_db)
        } catch (e) {
          reject(e)
        }
      })
    }
    const is_low_db_backup = await checkLowDbBackup();
    const {getDatabaseManager} = require('../../../app/server/databaseRegistry')

    try {
      if (is_low_db_backup) {
        await zip.close()
        getDatabaseManager().closeConnection()
        const tasksLowDb = require('./TasksMigrateFromLowDb.controller')(db)
        await tasksLowDb.migrateFromLowDb(backupPath)
        await getDatabaseManager().reloadCurrentDatabase()
        res.sendStatus(201)
        return
      }

      getDatabaseManager().closeConnection()

      getDatabaseManager().removeSqliteFiles(dbFile)

      const rmrf = (folder: unknown) => rimraf(folder)
      await rmrf(mediaFiles)
      await rmrf(metaFiles)

      await zip.extract(null, dbPath)
      await zip.close()

      await getDatabaseManager().reloadCurrentDatabase()
      res.sendStatus(201)
    } catch (e: unknown) {
      console.error('restoreBackup failed:', e)
      try {
        await getDatabaseManager().reloadCurrentDatabase()
      } catch (reloadErr: unknown) {
        console.error('restoreBackup reload failed:', reloadErr)
      }
      res.status(400).send({message: apiErrorMessage(e) || String(e)})
    } finally {
      try {
        await zip.close()
      } catch {
        // archive may already be closed
      }
    }
  };

  const importBackup = async (req: ApiRequest, res: ApiResponse) => {
    const {normalizeUserPath} = require('../../utils/normalizeUserPath')
    const fromPath = normalizeUserPath(req.body.path)
    if (!fromPath || !fs.existsSync(fromPath)) {
      res.status(400).send({message: 'File not found'})
      return
    }
    const archive = path.basename(fromPath)
    const toPath = path.join(getBackupsPath(), archive)
    try {
      fse.copySync(fromPath, toPath, {overwrite: false})
      res.sendStatus(201)
      console.log("Successfully imported.")
    } catch (err) {
      console.log(err)
      res.status(400).send(err)
    }
  };

  const exportBackup = async (req: ApiRequest, res: ApiResponse) => {
    const archive = req.body?.archive
    const destDir = req.body?.path

    if (!archive || !destDir) {
      res.status(400).send({ message: 'Archive name and destination path are required' })
      return
    }

    const fromPath = path.join(getBackupsPath(), archive + '.zip')
    const toPath = path.join(destDir, archive + '.zip')

    if (!fs.existsSync(fromPath)) {
      res.status(400).send({ message: `Backup not found: ${archive}` })
      return
    }

    if (!fs.existsSync(destDir)) {
      res.status(400).send({ message: `Destination folder not found: ${destDir}` })
      return
    }

    try {
      await fse.copy(fromPath, toPath, { overwrite: true })
      res.sendStatus(201)
      console.log('Successfully exported backup to', toPath)
    } catch (err) {
      console.error('exportBackup error:', err)
      res.status(400).send({ message: apiErrorMessage(err) || String(err) })
    }
  };

  return {
    createBackup,
    getBackups,
    deleteBackup,
    restoreBackup,
    importBackup,
    exportBackup,
  }
}