#!/usr/bin/env node
import {spawn} from 'child_process'
import {dirname, join} from 'path'
import {fileURLToPath} from 'url'

const scripts = process.argv.slice(2)
if (!scripts.length) {
  console.error('Usage: node scripts/parallel-npm.mjs <npm-script> ...')
  process.exit(1)
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

Promise.all(scripts.map((script) => new Promise((resolve, reject) => {
  const child = spawn('npm', ['run', script], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  })
  child.on('exit', (code) => {
    if (code === 0) resolve()
    else reject(new Error(`npm run ${script} failed with exit code ${code}`))
  })
}))).catch((error) => {
  console.error(error.message)
  process.exit(1)
})
