#!/usr/bin/env node
import {spawnSync} from 'child_process'
import {createRequire} from 'module'
import {dirname, join} from 'path'
import {fileURLToPath} from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

function run(command, args = []) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

run('npm', ['rebuild', 'better-sqlite3'])
run('node', ['scripts/ensure-electron-native.mjs'])

const nodeAbi = String(process.versions.modules)
const electronAbi = spawnSync(
  require('electron'),
  ['-p', 'process.versions.modules'],
  {
    cwd: root,
    encoding: 'utf8',
    env: {...process.env, ELECTRON_RUN_AS_NODE: '1'},
  },
).stdout?.trim()

if (electronAbi && electronAbi !== nodeAbi) {
  run('npm', ['rebuild', 'better-sqlite3'])
}
run('node', ['scripts/compile.mjs', 'artifacts'])
