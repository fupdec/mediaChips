import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import {
  ensureLegacyDrizzleBaseline,
  runDrizzleMigrations,
} from './drizzleMigrations'

describe('drizzleMigrations', () => {
  const tempFiles: string[] = []

  afterEach(() => {
    for (const filePath of tempFiles.splice(0)) {
      fs.rmSync(filePath, {force: true})
    }
  })

  function createTempDbPath(): string {
    const filePath = path.join(os.tmpdir(), `mediachips-drizzle-${Date.now()}-${Math.random()}.sqlite`)
    tempFiles.push(filePath)
    return filePath
  }

  it('creates schema on a fresh database', () => {
    const dbPath = createTempDbPath()

    runDrizzleMigrations(dbPath)

    const sqlite = new Database(dbPath)
    try {
      expect(sqlite.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='media'`).get()).toBeTruthy()
      expect(sqlite.prepare(`SELECT COUNT(*) as count FROM __drizzle_migrations`).get()).toEqual({count: 1})
    } finally {
      sqlite.close()
    }
  })

  it('baselines legacy databases without re-running initial schema', () => {
    const dbPath = createTempDbPath()
    const sqlite = new Database(dbPath)

    try {
      sqlite.exec(`CREATE TABLE media (id INTEGER PRIMARY KEY AUTOINCREMENT, path TEXT NOT NULL)`)
      ensureLegacyDrizzleBaseline(sqlite)

      expect(sqlite.prepare(`SELECT COUNT(*) as count FROM __drizzle_migrations`).get()).toEqual({count: 1})
    } finally {
      sqlite.close()
    }

    expect(() => runDrizzleMigrations(dbPath)).not.toThrow()

    const reopened = new Database(dbPath)
    try {
      expect(reopened.prepare(`SELECT COUNT(*) as count FROM __drizzle_migrations`).get()).toEqual({count: 1})
    } finally {
      reopened.close()
    }
  })
})
