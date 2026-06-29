import fs from 'node:fs'
import path from 'node:path'
import { globSync } from 'node:fs'

const root = process.cwd()

function fixRouteContent(content) {
  const lines = content.split('\n')
  const hoisted = []
  const kept = []
  let pastExport = false

  for (const line of lines) {
    if (line.startsWith('export default function')) pastExport = true
    if (pastExport && line.startsWith('import ')) {
      hoisted.push(line)
      continue
    }
    kept.push(line)
  }

  if (!hoisted.length) return content

  let insertAt = 0
  for (let i = 0; i < kept.length; i += 1) {
    if (kept[i].startsWith('import ')) insertAt = i + 1
  }

  kept.splice(insertAt, 0, ...hoisted, '')
  return kept.join('\n').replace(/\n{3,}/g, '\n\n')
}

for (const file of globSync('api/routes/**/*.ts')) {
  if (file.endsWith('types.ts')) continue
  const absolute = path.join(root, file)
  const fixed = fixRouteContent(fs.readFileSync(absolute, 'utf8'))
  fs.writeFileSync(absolute, fixed)
}

console.log('Fixed hoisted imports in route files')
