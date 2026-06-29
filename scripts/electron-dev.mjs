#!/usr/bin/env node
import {spawn, spawnSync} from 'child_process'
import {createConnection} from 'net'
import {dirname, join} from 'path'
import {fileURLToPath} from 'url'
import chokidar from 'chokidar'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const vitePort = Number(process.env.VITE_DEV_SERVER_PORT || 3000)
const watchPaths = [
  'main.ts',
  'electron/**/*.ts',
  'app/**/*.ts',
  'api/**/*.ts',
  'shared/**/*.ts',
]

let viteProc = null
let electronProc = null
let rebuildTimer = null
let rebuildInFlight = false
let restartPending = false
let shuttingDown = false

function runSync(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function waitForPort(port, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now()

    const tryConnect = () => {
      const socket = createConnection({port, host: '127.0.0.1'})

      socket.once('connect', () => {
        socket.end()
        resolve()
      })

      socket.once('error', () => {
        socket.destroy()
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Vite dev server did not start on port ${port}`))
          return
        }
        setTimeout(tryConnect, 200)
      })
    }

    tryConnect()
  })
}

function killProcess(proc, signal = 'SIGTERM') {
  if (!proc || proc.killed || proc.exitCode != null) return
  proc.kill(signal)
}

function startVite() {
  viteProc = spawn('npm', ['run', 'dev'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      VITE_DEV_SERVER_PORT: String(vitePort),
    },
  })
}

function startElectron() {
  killProcess(electronProc)
  electronProc = spawn('npx', ['electron', '.'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      MEDIA_CHIPS_VITE_DEV: '1',
      VITE_DEV_SERVER_PORT: String(vitePort),
    },
  })

  electronProc.on('exit', (code, signal) => {
    electronProc = null
    if (shuttingDown || restartPending) return
    if (signal === 'SIGTERM' || signal === 'SIGINT') return
    cleanup(code ?? 0)
  })
}

async function rebuildBackend() {
  if (rebuildInFlight) return
  rebuildInFlight = true
  restartPending = true

  try {
    console.log('\n[electron-dev] rebuilding backend shell...')
    killProcess(electronProc)
    await new Promise((resolve) => setTimeout(resolve, 300))
    runSync('npm', ['run', 'build:electron-artifacts'])
    if (!shuttingDown) {
      console.log('[electron-dev] restarting electron...')
      restartPending = false
      startElectron()
    }
  } finally {
    rebuildInFlight = false
    restartPending = false
  }
}

function scheduleBackendRebuild() {
  if (shuttingDown) return
  clearTimeout(rebuildTimer)
  rebuildTimer = setTimeout(() => {
    rebuildBackend().catch((error) => {
      console.error('[electron-dev] rebuild failed:', error)
    })
  }, 1000)
}

function startBackendWatcher() {
  const watcher = chokidar.watch(watchPaths, {
    cwd: root,
    ignoreInitial: true,
  })

  watcher.on('all', (event, filePath) => {
    if (!filePath || shuttingDown) return
    console.log(`[electron-dev] ${event} ${filePath}`)
    scheduleBackendRebuild()
  })

  return watcher
}

function cleanup(code = 0) {
  if (shuttingDown) return
  shuttingDown = true

  clearTimeout(rebuildTimer)
  killProcess(electronProc)
  killProcess(viteProc)

  setTimeout(() => process.exit(code), 100)
}

async function main() {
  console.log('[electron-dev] initial backend build...')
  runSync('npm', ['run', 'build:electron-artifacts'])
  runSync('node', ['scripts/ensure-electron-native.mjs'])

  console.log(`[electron-dev] starting Vite on port ${vitePort}...`)
  startVite()
  await waitForPort(vitePort)

  startElectron()
  startBackendWatcher()

  process.on('SIGINT', () => cleanup(0))
  process.on('SIGTERM', () => cleanup(0))
}

main().catch((error) => {
  console.error('[electron-dev] failed:', error)
  cleanup(1)
})
