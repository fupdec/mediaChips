/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { readImageAsDataUrl } from './thumbEncoding'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'

describe('thumbEncoding', () => {
  it('reads an image file as a data URL', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'mc-thumb-'))
    const filePath = path.join(dir, 'thumb.jpg')
    await fs.writeFile(filePath, Buffer.from('fake-jpeg'))

    const dataUrl = await readImageAsDataUrl(filePath)

    expect(dataUrl).toMatch(/^data:image\/jpeg;base64,/)
    await fs.rm(dir, { recursive: true, force: true })
  })
})
