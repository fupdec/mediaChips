#!/usr/bin/env node
import {spawn, spawnSync} from 'child_process'
import {createConnection} from 'node:net'
import {dirname, join} from 'path'
import {fileURLToPath} from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const E2E_PORT = 12321

function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = createConnection({host: '127.0.0.1', port})
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => resolve(false))
  })
}

async function ensurePortAvailable() {
  if (await isPortInUse(E2E_PORT)) {
    console.error(`Port ${E2E_PORT} is already in use. Stop MediaChips/Electron before running E2E tests.`)
    console.error(`Find the process: lsof -i :${E2E_PORT}`)
    process.exit(1)
  }
}

function run(command, args = []) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

await ensurePortAvailable()
if (!process.env.SKIP_E2E_BUILD) {
  run('npm', ['run', 'build:app'])
}
run('node', ['scripts/run-server.mjs', '--prepare'])

const server = spawn('node', ['app/server.js'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'production',
  },
})

const shutdown = (signal) => {
  if (!server.killed) {
    server.kill(signal)
  }
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

server.on('exit', (code, signal) => {
  if (signal === 'SIGTERM' || signal === 'SIGINT') {
    process.exit(0)
  }
  process.exit(code ?? 1)
})
