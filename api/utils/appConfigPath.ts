const path = require('path')

function getAppConfigPath(): string {
  if (process.versions.electron && process.app_folder) {
    return path.join(process.app_folder, 'config.json')
  }

  return path.join(__dirname, '../../public/config.json')
}

module.exports = {
  getAppConfigPath,
}
