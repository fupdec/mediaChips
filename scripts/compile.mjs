#!/usr/bin/env node
import {spawnSync} from 'child_process'
import {dirname, join} from 'path'
import {fileURLToPath} from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const TARGETS = {
  shared: 'npx tsc -p tsconfig.shared-build.json && rsync -a .shared-build/shared/ shared/',
  app: 'npx tsc -p tsconfig.app.json && rsync -a .app-build/app/ app/',
  api: 'npx tsc -p tsconfig.api.json && rsync -a .api-build/api/ api/',
  electron: 'npx tsc -p tsconfig.electron.json && cp .electron-build/electron/*.js electron/',
  main: 'npx tsc -p tsconfig.main.json && cp .main-build/main.js main.js',
  scripts: 'npx tsc -p tsconfig.scripts.json',
}

function runShell(command) {
  const result = spawnSync(command, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function runTarget(name) {
  const command = TARGETS[name]
  if (!command) {
    console.error(`Unknown compile target: ${name}`)
    console.error(`Available: ${Object.keys(TARGETS).join(', ')}, backend, electron-artifacts, artifacts`)
    process.exit(1)
  }

  runShell(command)
}

async function runParallel(names) {
  const {spawn} = await import('child_process')

  await Promise.all(names.map((name) => new Promise((resolve, reject) => {
    const command = TARGETS[name]
    if (!command) {
      reject(new Error(`Unknown compile target: ${name}`))
      return
    }

    const child = spawn(command, {
      cwd: root,
      stdio: 'inherit',
      shell: true,
    })

    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`compile ${name} failed with exit code ${code}`))
    })
  })))
}

async function runGroup(name) {
  switch (name) {
    case 'backend':
      runTarget('shared')
      await runParallel(['app', 'api'])
      return
    case 'electron-artifacts':
      await runParallel(['electron', 'main'])
      await runGroup('backend')
      return
    case 'artifacts':
      runTarget('scripts')
      await runGroup('electron-artifacts')
      return
    default:
      runTarget(name)
  }
}

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--')

  if (!args.length) {
    console.error('Usage: node scripts/compile.mjs <target> [target...]')
    console.error('       node scripts/compile.mjs --parallel <target> [target...]')
    process.exit(1)
  }

  if (args[0] === '--parallel') {
    await runParallel(args.slice(1))
    return
  }

  for (const arg of args) {
    await runGroup(arg)
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
