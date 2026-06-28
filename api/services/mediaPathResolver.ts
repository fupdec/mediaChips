import type { ApiDb, AnyRecord, MediaLike, FilterLike, TagLike, MetaLike } from '../types/db'

const {resolveActiveDbFilePath} = require('./activeDbFileResolver')

async function resolveMediaInputPath(inputPath: string, dbPath: any) {
  return resolveActiveDbFilePath(inputPath, dbPath)
}

module.exports = {
  resolveMediaInputPath,
  resolveActiveDbFilePath,
}
