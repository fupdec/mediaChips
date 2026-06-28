import packageJson from '../../package.json'

const BUILD_ONLY = new Set([
  '@electron/rebuild',
  '@vitejs/plugin-vue',
  'vite-plugin-vuetify',
  'sass-embedded',
  'vite',
  'nodemon',
  'electron-builder',
])

function npmPackageUrl(name: string): string {
  return `https://www.npmjs.com/package/${name}`
}

export interface ProjectDependency {
  name: string
  version: string
  url: string
}

export function getProjectDependencies(): ProjectDependency[] {
  const merged: Record<string, string> = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }

  return Object.keys(merged)
    .filter((name) => !BUILD_ONLY.has(name))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .map((name) => ({
      name,
      version: merged[name].replace(/^[\^~]/, ''),
      url: npmPackageUrl(name),
    }))
}
