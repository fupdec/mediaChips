#!/usr/bin/env node
import {spawnSync} from 'child_process'
import {dirname, join} from 'path'
import {fileURLToPath} from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const result = spawnSync('npx', ['electron', '.'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'production',
    MEDIA_CHIPS_VITE_DEV: '0',
  },
})

process.exit(result.status ?? 1)
