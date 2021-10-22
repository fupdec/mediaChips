const { PluginManager } = require('live-plugin-manager')
const pluginManager = new PluginManager()

module.exports = async (pluginsDir) => {
  await pluginManager.installFromPath(pluginsDir)
  const package = pluginManager.require('pink')
  return package
}