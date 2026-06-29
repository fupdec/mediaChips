#!/usr/bin/env node
import {spawnSync} from 'child_process'
import {createRequire} from 'module'
import {dirname, join} from 'path'
import {fileURLToPath} from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const force = process.argv.includes('--force')
const require = createRequire(import.meta.url)
const electronPath = require('electron')
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function canLoadNativeInElectron() {
  const result = spawnSync(
    electronPath,
    ['-e', "require('better-sqlite3')"],
    {
      cwd: root,
      stdio: 'ignore',
      env: {...process.env, ELECTRON_RUN_AS_NODE: '1'},
    },
  )

  return result.status === 0
}

if (!force && canLoadNativeInElectron()) {
  console.log('electron native modules already built, skipping rebuild')
  process.exit(0)
}

run('npx', ['electron-rebuild', '-f', '-w', 'better-sqlite3'])
run('node', ['scripts/sign-native-modules.mjs'])
