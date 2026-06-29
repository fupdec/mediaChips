#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function stripDualExport(source) {
  let content = source

  content = content.replace(
    /module\.exports\s*=\s*createApiDb\s*\nmodule\.exports\.createApiDb\s*=\s*createApiDb\s*\n?/g,
    '',
  )

  content = content.replace(
    /module\.exports\s*=\s*\{[\s\S]*?\}\s*\n?/g,
    '',
  )

  content = content.replace(
    /^module\.exports\s*=.*\n?/gm,
    '',
  )

  return content.replace(/\n{3,}/g, '\n\n')
}

function collectTsFiles(dir) {
  const results = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectTsFiles(absolute))
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
      results.push(absolute)
    }
  }
  return results
}

let changed = 0

for (const absolute of [...collectTsFiles(path.join(root, 'api')), ...collectTsFiles(path.join(root, 'app'))]) {
  const source = fs.readFileSync(absolute, 'utf8')

  if (!source.includes('module.exports')) continue

  const next = stripDualExport(source)
  if (next === source) continue

  fs.writeFileSync(absolute, next)
  changed += 1
}

console.log(`Removed dual-export blocks from ${changed} files`)
