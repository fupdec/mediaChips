#!/usr/bin/env node
import {existsSync, readdirSync, readFileSync} from 'fs'
import {homedir} from 'os'
import {join} from 'path'
import {spawnSync} from 'child_process'

export const MIN_NODE_MAJOR = 20

export function getNodeMajor(version = process.version) {
  return Number(String(version).replace(/^v/, '').split('.')[0])
}

function compareSemverDesc(a, b) {
  const pa = a.slice(1).split('.').map(Number)
  const pb = b.slice(1).split('.').map(Number)

  for (let index = 0; index < 3; index += 1) {
    const left = pb[index] || 0
    const right = pa[index] || 0
    if (left !== right) return left - right
  }

  return 0
}

function readNvmrcVersion(cwd) {
  try {
    return readFileSync(join(cwd, '.nvmrc'), 'utf8').trim().replace(/^v/, '')
  } catch {
    return null
  }
}

export function resolvePreferredNode(cwd = process.cwd()) {
  if (getNodeMajor() >= MIN_NODE_MAJOR) {
    return null
  }

  const candidates = []
  const nvmrcVersion = readNvmrcVersion(cwd)
  const nvmDir = process.env.NVM_DIR || join(homedir(), '.nvm')
  const versionsDir = join(nvmDir, 'versions/node')

  if (!existsSync(versionsDir)) {
    return null
  }

  const versions = readdirSync(versionsDir)
    .filter((version) => version.startsWith('v'))
    .sort(compareSemverDesc)

  if (nvmrcVersion) {
    const match = versions.find((version) => (
      version === `v${nvmrcVersion}`
      || version.startsWith(`v${nvmrcVersion}.`)
    ))
    if (match) {
      candidates.push(join(versionsDir, match, 'bin/node'))
    }
  }

  for (const version of versions) {
    if (getNodeMajor(version) >= MIN_NODE_MAJOR) {
      candidates.push(join(versionsDir, version, 'bin/node'))
    }
  }

  for (const nodePath of candidates) {
    if (existsSync(nodePath)) {
      return nodePath
    }
  }

  return null
}

export function ensurePreferredNodeOrExit(cwd = process.cwd()) {
  const preferredNode = resolvePreferredNode(cwd)

  if (!preferredNode) {
    if (getNodeMajor() < MIN_NODE_MAJOR) {
      console.error(
        `[mediachips] Node ${MIN_NODE_MAJOR}+ required (current: ${process.version}).`,
        'Install with nvm: nvm install 22',
      )
      process.exit(1)
    }
    return
  }

  if (preferredNode === process.execPath) {
    return
  }

  console.log(`[mediachips] switching to ${preferredNode}`)
  const result = spawnSync(preferredNode, process.argv.slice(1), {
    cwd,
    stdio: 'inherit',
    env: process.env,
  })
  process.exit(result.status ?? 1)
}
