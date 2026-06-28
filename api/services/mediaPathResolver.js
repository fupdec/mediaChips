const {resolveActiveDbFilePath} = require('./activeDbFileResolver')

async function resolveMediaInputPath(inputPath, dbPath) {
  return resolveActiveDbFilePath(inputPath, dbPath)
}

module.exports = {
  resolveMediaInputPath,
  resolveActiveDbFilePath,
}
