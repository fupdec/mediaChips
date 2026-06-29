import type { ApiDb, AnyRecord, MediaLike, FilterLike, TagLike, MetaLike } from '../types/db'

import { resolveActiveDbFilePath } from './activeDbFileResolver'

async function resolveMediaInputPath(inputPath: string, dbPath: string) {
  return resolveActiveDbFilePath(inputPath, dbPath)
}

module.exports = {
  resolveMediaInputPath,
  resolveActiveDbFilePath,
}

export { resolveMediaInputPath, resolveActiveDbFilePath }
