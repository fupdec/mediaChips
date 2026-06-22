const crypto = require('crypto')
const fs = require('fs')
const {access} = require('fs/promises')

const computeContentHash = (pathToFile) => new Promise((resolve, reject) => {
  const hash = crypto.createHash('sha256')
  const stream = fs.createReadStream(pathToFile)

  stream.on('data', (chunk) => hash.update(chunk))
  stream.on('end', () => resolve(hash.digest('hex')))
  stream.on('error', reject)
})

const fileExists = async (pathToFile) => {
  try {
    await access(pathToFile, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
}

module.exports = {
  computeContentHash,
  fileExists,
}
