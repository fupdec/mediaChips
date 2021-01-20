const stringify = function stringify(obj) {
  return JSON.stringify(obj, null, 2)
}

class Base {
  constructor(
    source,
    { defaultValue = {}, serialize = stringify, deserialize = JSON.parse } = {}
  ) {
    this.source = source
    this.defaultValue = defaultValue
    this.serialize = serialize
    this.deserialize = deserialize
  }
}

const fs = require('graceful-fs')
const writeFileAtomic = require('write-file-atomic');
const readFile = fs.readFileSync

// Same code as in FileAsync, minus `await`
class FileSync extends Base {
  read() {
    // fs.exists is deprecated but not fs.existsSync
    if (fs.existsSync(this.source)) {
      // Read database
      try {
        const data = readFile(this.source, 'utf-8').trim()
        // Handle blank file
        return data ? this.deserialize(data) : this.defaultValue
      } catch (e) {
        if (e instanceof SyntaxError) {
          e.message = `Malformed JSON in file: ${this.source}\n${e.message}`
        }
        throw e
      }
    } else {
      // Initialize
			writeFileAtomic(this.source, this.serialize(this.defaultValue), null, function (err) {
				if (err) throw err;
				console.log('It\'s saved!');
			});
      return this.defaultValue
    }
  }

  write(data) {
    return writeFileAtomic(this.source, this.serialize(data))
  }
}

module.exports = FileSync