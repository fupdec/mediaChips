/// <reference types="node" />
import { describe, expect, it } from 'vitest'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { resolveActiveDbFilePath } from '../../api/services/activeDbFileResolver.js'

describe('resolveActiveDbFilePath', () => {
  it('resolves files relative to the active database media folder', () => {
    const dbPath = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-db-'))
    const mediaDir = path.join(dbPath, 'media', 'videos')
    fs.mkdirSync(mediaDir, { recursive: true })
    const videoPath = path.join(mediaDir, 'sample.mp4')
    fs.writeFileSync(videoPath, 'video')

    const resolved = resolveActiveDbFilePath('videos/sample.mp4', dbPath)

    expect(resolved).toBe(videoPath)

    fs.rmSync(dbPath, { recursive: true, force: true })
  })
})
