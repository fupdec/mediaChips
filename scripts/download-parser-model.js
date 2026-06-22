const fs = require('fs')
const path = require('path')

const PARSER_MODEL = 'Xenova/all-MiniLM-L6-v2'
const cacheDir = path.join(__dirname, '..', 'models')

async function main() {
  fs.mkdirSync(cacheDir, {recursive: true})

  const {pipeline, env} = require('@xenova/transformers')
  env.cacheDir = cacheDir
  env.localModelPath = cacheDir
  env.allowRemoteModels = true
  env.allowLocalModels = true

  console.log(`Downloading parser model ${PARSER_MODEL} to ${cacheDir}`)
  await pipeline('feature-extraction', PARSER_MODEL, {quantized: true})
  console.log('Parser model is ready')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
