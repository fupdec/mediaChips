'use strict';

const BetterSqlite3 = require('better-sqlite3');

const OPEN_READONLY = 0x00000001;
const OPEN_READWRITE = 0x00000002;
const OPEN_CREATE = 0x00000004;
const OPEN_FULLMUTEX = 0x00010000;

let verboseLogger = null;

function parseArgs(args) {
  let callback = null;
  if (args.length > 0 && typeof args[args.length - 1] === 'function') {
    callback = args.pop();
  }

  let params = [];
  if (args.length === 1) {
    params = args[0];
  } else if (args.length > 1) {
    params = args;
  }

  if (params == null) {
    params = [];
  }

  return {params, callback};
}

function sanitizeBindValue(value) {
  if (value == null) {
    return null;
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const type = typeof value;
  if (type === 'number' || type === 'string' || type === 'bigint' || Buffer.isBuffer(value)) {
    return value;
  }

  return String(value);
}

function normalizeParams(params) {
  if (params == null) {
    return [];
  }

  if (Array.isArray(params)) {
    return params.map(sanitizeBindValue);
  }

  if (typeof params !== 'object') {
    return [sanitizeBindValue(params)];
  }

  const keys = Object.keys(params);
  if (keys.length > 0 && keys.every((key) => /^\$\d+$/.test(key))) {
    const normalized = {};
    for (const key of keys) {
      const value = sanitizeBindValue(params[key]);
      normalized[key] = value;
      normalized[key.slice(1)] = value;
    }
    return normalized;
  }

  const normalized = {};
  for (const key of keys) {
    const value = sanitizeBindValue(params[key]);
    if (/^[:@$]/.test(key)) {
      normalized[key] = value;
    } else {
      normalized[`:${key}`] = value;
    }
  }
  return normalized;
}

function runStatement(db, method, sql, params, callback) {
  const boundParams = normalizeParams(params);

  try {
    if (method === 'run') {
      const result = Array.isArray(boundParams)
        ? db.prepare(sql).run(...boundParams)
        : db.prepare(sql).run(boundParams);

      if (callback) {
        const context = {
          lastID: result.lastInsertRowid,
          changes: result.changes,
        };
        callback.call(context, null);
      }

      return result;
    }

    const stmt = db.prepare(sql);
    const result = Array.isArray(boundParams)
      ? stmt[method](...boundParams)
      : stmt[method](boundParams);

    if (callback) {
      callback(null, method === 'all' ? result : result);
    }

    return result;
  } catch (err) {
    if (method === 'all' && err.message && err.message.includes('Use run() instead')) {
      const result = Array.isArray(boundParams)
        ? db.prepare(sql).run(...boundParams)
        : db.prepare(sql).run(boundParams);

      if (callback) {
        callback(null, []);
      }

      return result;
    }

    if (callback) {
      callback(err);
      return;
    }

    throw err;
  }
}

class Database {
  constructor(filename, mode, callback) {
    if (typeof mode === 'function') {
      callback = mode;
      mode = undefined;
    }

    this.filename = filename;

    try {
      const readonly = mode != null
        && (mode & OPEN_READONLY) !== 0
        && (mode & OPEN_READWRITE) === 0;
      const fileMustExist = mode != null
        && (mode & OPEN_CREATE) === 0
        && filename !== ':memory:';

      this._db = new BetterSqlite3(filename, {
        readonly,
        fileMustExist,
        verbose: verboseLogger || undefined,
      });

      if (callback) {
        process.nextTick(() => callback(null));
      }
    } catch (err) {
      if (callback) {
        process.nextTick(() => callback(err));
      } else {
        throw err;
      }
    }
  }

  run(sql, ...args) {
    const {params, callback} = parseArgs(args);
    return runStatement(this._db, 'run', sql, params, callback);
  }

  all(sql, ...args) {
    const {params, callback} = parseArgs(args);
    return runStatement(this._db, 'all', sql, params, callback);
  }

  get(sql, ...args) {
    const {params, callback} = parseArgs(args);
    return runStatement(this._db, 'get', sql, params, callback);
  }

  serialize(callback) {
    if (callback) {
      callback();
    }
  }

  parallelize(callback) {
    if (callback) {
      callback();
    }
  }

  close(callback) {
    try {
      this._db.close();
      if (callback) {
        process.nextTick(() => callback(null));
      }
    } catch (err) {
      if (callback) {
        process.nextTick(() => callback(err));
      } else {
        throw err;
      }
    }
  }
}

module.exports = {
  Database,
  OPEN_READONLY,
  OPEN_READWRITE,
  OPEN_CREATE,
  OPEN_FULLMUTEX,
  verbose() {
    verboseLogger = console.log;
    return module.exports;
  },
};
