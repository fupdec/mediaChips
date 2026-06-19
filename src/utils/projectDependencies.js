import packageJson from '../../package.json'

const BUILD_ONLY = new Set([
  '@vitejs/plugin-vue',
  'vite-plugin-vuetify',
  'sass',
  'sass-embedded',
  'vite',
  'nodemon',
  'electron-builder',
])

function npmPackageUrl(name) {
  return `https://www.npmjs.com/package/${name}`
}

export function getProjectDependencies() {
  const merged = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }

  return Object.keys(merged)
    .filter((name) => !BUILD_ONLY.has(name))
    .sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}))
    .map((name) => ({
      name,
      version: merged[name].replace(/^[\^~]/, ''),
      url: npmPackageUrl(name),
    }))
}
