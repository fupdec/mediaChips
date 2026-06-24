const express = require('express')
const router = express.Router()
const jsonParser = express.json()
const path = require('path')
const fs = require('fs')
const history = require('connect-history-api-fallback')
const app = express()
const os = require('os')
const {
  Umzug,
  SequelizeStorage
} = require('umzug');
const package_json = require('../package.json');

// ==================== FIXED PORT 12321 ====================
const FIXED_PORT = 12321;
const LAN_ENABLED_VALUES = ['1', 'true', 'yes', 'on'];
const ALLOW_LAN = LAN_ENABLED_VALUES.includes(String(process.env.MEDIA_CHIPS_ALLOW_LAN || '').toLowerCase());
const BIND_HOST = ALLOW_LAN ? '0.0.0.0' : '127.0.0.1';

function isLoopbackHost(hostname) {
  return ['localhost', '127.0.0.1', '::1'].includes(hostname);
}

function isPrivateIpv4(hostname) {
  return /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
}

function isAllowedOrigin(origin) {
  if (!origin) return true;

  try {
    const parsed = new URL(origin);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;

    const hostname = parsed.hostname.toLowerCase();
    return isLoopbackHost(hostname) || (ALLOW_LAN && isPrivateIpv4(hostname));
  } catch {
    return false;
  }
}

// ==================== CORS FOR LOCAL DEVELOPMENT ====================
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!isAllowedOrigin(origin)) {
    return res.status(403).json({ error: 'Origin is not allowed' });
  }

  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Content-Disposition');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Content-Disposition');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json({
  limit: '100mb'
}));

app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} ${req.headers.origin || 'no origin'}`);
  next();
});

app.use(router)

// ==================== PATH UTILITIES ====================
function getBestLocalIp() {
  const interfaces = os.networkInterfaces();
  const preferredOrder = [
    'en0', 'eth0', 'wlan0', // WiFi/Ethernet
    'en1', 'en2', 'en3',    // Other network interfaces
    'bridge100', 'bridge0'  // Bridges
  ];

  const ipPriority = [
    '192.168.',    // Home networks
    '10.',         // Corporate networks
    '172.16.',     // More corporate networks
    '169.254.'     // Link-local (last resort)
  ];

  const allIps = [];
  for (const [name, ifaces] of Object.entries(interfaces)) {
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        allIps.push({
          address: iface.address,
          interface: name,
          mac: iface.mac,
          isLinkLocal: iface.address.startsWith('169.254.')
        });
      }
    }
  }

  for (const ifaceName of preferredOrder) {
    const interfaceIp = allIps.find(ip => ip.interface === ifaceName && !ip.isLinkLocal);
    if (interfaceIp) {
      console.log(`Selected IP ${interfaceIp.address} by interface priority ${ifaceName}`);
      return interfaceIp.address;
    }
  }

  const nonLinkLocalIps = allIps.filter(ip => !ip.isLinkLocal);
  for (const prefix of ipPriority) {
    const matchingIp = nonLinkLocalIps.find(ip => ip.address.startsWith(prefix));
    if (matchingIp) {
      console.log(`Selected IP ${matchingIp.address} by prefix ${prefix}`);
      return matchingIp.address;
    }
  }

  if (nonLinkLocalIps.length > 0) {
    console.log(`Selected first non-link-local IP: ${nonLinkLocalIps[0].address}`);
    return nonLinkLocalIps[0].address;
  }

  if (allIps.length > 0) {
    console.log(`All IPs are link-local, selected: ${allIps[0].address}`);
    return allIps[0].address;
  }

  console.log('No IP found, using localhost');
  return '127.0.0.1';
}

function getAllIps() {
  const interfaces = os.networkInterfaces();
  const ips = [];

  for (const [name, ifaces] of Object.entries(interfaces)) {
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({
          address: iface.address,
          interface: name,
          mac: iface.mac,
          netmask: iface.netmask,
          cidr: iface.cidr
        });
      }
    }
  }

  return ips;
}

// ==================== PATH CONFIGURATION ====================
let app_folder
const is_electron_running = process.versions['electron'];
if (is_electron_running) {
  app_folder = process.env.PORTABLE_EXECUTABLE_DIR || process.electron_app.getPath('userData')
  process.app_folder = app_folder

  const oldDbPath = path.join(app_folder, 'databases');
  const newDbPath = path.join(app_folder, 'app_storage'); // New safe name

  if (fs.existsSync(oldDbPath)) {
    try {
      // If the folder exists, rename it so Chromium won't recognize
      // and delete it.
      fs.renameSync(oldDbPath, newDbPath);
      console.log('Data successfully preserved and moved to app_storage');
    } catch (err) {
      console.error('Error while preserving data:', err);
    }
  }
}

// creating default config
let configPath
if (is_electron_running) {
  // production
  configPath = path.join(app_folder, '/config.json')
} else {
  // development
  configPath = path.join(__dirname, '../public/config.json')
}

console.log('\x1b[33m%s\x1b[0m', '=== SERVER SETUP ===');

// Load or create config
let config;
try {
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('\x1b[33m%s\x1b[0m', `Config loaded from ${configPath}`);
  } else {
    throw new Error('Config file not found');
  }
} catch (e) {
  console.log('\x1b[33m%s\x1b[0m', 'Creating new config...');
  config = {
    port: FIXED_PORT,
    databases: [{
      id: Date.now().toString(16),
      name: 'Default',
      active: true,
      createdAt: Date.now(),
    }]
  };
}

// ==================== FIX CONFIG ====================
const allIpsInfo = getAllIps();
const bestIp = getBestLocalIp();

config.ip = ALLOW_LAN ? bestIp : 'localhost';
config.ips = ALLOW_LAN ? allIpsInfo.map(ip => ip.address) : [];
config.hostname = ALLOW_LAN ? os.hostname() : 'localhost';
config.port = FIXED_PORT;

// Find active database
const activeDb = config.databases.find(db => db.active);
if (!activeDb) {
  console.error('\x1b[31m%s\x1b[0m', '❌ No active database!');
  // Make the first database active
  if (config.databases.length > 0) {
    config.databases[0].active = true;
    console.log('\x1b[33m%s\x1b[0m', `Activated first database: ${config.databases[0].name}`);
  }
}

// Save config
const configDir = path.dirname(configPath);
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// ==================== DATABASE PATHS ====================
let databasesPath
if (is_electron_running) {
  databasesPath = path.join(app_folder, '/app_storage')
} else {
  databasesPath = path.join(__dirname, '../app_storage')
}

// Fix path in config - must point to the active database
const currentActiveDb = config.databases.find(db => db.active);
if (currentActiveDb) {
  config.path = path.join(databasesPath, currentActiveDb.id);
  console.log('\x1b[36m%s\x1b[0m', `Active database: ${currentActiveDb.name} (${currentActiveDb.id})`);
  console.log('\x1b[36m%s\x1b[0m', `Database path: ${config.path}`);
} else {
  console.error('\x1b[31m%s\x1b[0m', '❌ Failed to determine active database');
  config.path = path.join(databasesPath, config.databases[0]?.id || 'default');
}

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('\x1b[32m%s\x1b[0m', `✅ Config saved. Primary IP: ${bestIp}, Port: ${FIXED_PORT}`);

// ==================== CREATE DIRECTORIES ====================
const createDirectories = () => {
  let userDirs = [databasesPath];

  for (let db of config.databases) {
    const dbPath = path.join(databasesPath, db.id);
    const mediaPath = path.join(dbPath, 'media');
    const metaPath = path.join(dbPath, 'meta');
    const backupPath = path.join(dbPath, 'backups');
    const videoPath = path.join(mediaPath, 'videos');
    const imagePath = path.join(mediaPath, 'images');
    const audioPath = path.join(mediaPath, 'audios');
    const textPath = path.join(mediaPath, 'texts');

    const videoSubDirs = ['thumbs', 'marks', 'grids', 'timelines'].map(subDir =>
      path.join(videoPath, subDir)
    );

    userDirs = [...userDirs, dbPath, mediaPath, metaPath, backupPath,
      videoPath, imagePath, audioPath, textPath, ...videoSubDirs];
  }

  for (let dir of userDirs) {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        console.log('\x1b[31m%s\x1b[0m', `❌ Error creating directory ${dir}:`, err.message);
      }
    }
  }
};

createDirectories();

// ==================== DATABASE SETUP ====================
const dbConfig = config.databases.find(i => i.active);
if (!dbConfig) {
  console.error('\x1b[31m%s\x1b[0m', '❌ No active database to connect to!');
  process.exit(1);
}

console.log('\x1b[36m%s\x1b[0m', `Connecting to database: ${dbConfig.name} (${dbConfig.id})`);

const Sequelize = require('sequelize');
const sequelize = new Sequelize({
  storage: path.join(databasesPath, dbConfig.id, 'db.sqlite'),
  dialect: 'sqlite',
  dialectOptions: {
    multipleStatements: true
  },
  logging: false
});

const db = require("../api")(sequelize);
db.config = dbConfig;
db.path_databases = databasesPath;
db.path = path.join(databasesPath, db.config.id);

// Test database connection
try {
  sequelize.authenticate();
  console.log('\x1b[36m%s\x1b[0m', '✅ Database connection successful');
  console.log('\x1b[36m%s\x1b[0m', `Database ID: ${db.config.id}`);
} catch (e) {
  console.log('\x1b[31m%s\x1b[0m', '❌ Database connection error: ', e);
}

// Sync database
sequelize.sync().then(async () => {
  console.log('\x1b[36m%s\x1b[0m', '✅ Database synchronized');

  try {
    const migrations_folder = path.join(__dirname, '../api/migrations/');
    if (fs.existsSync(migrations_folder)) {
      let migrations_list = fs.readdirSync(migrations_folder);
      migrations_list = migrations_list.sort().map(i => {
        let file_path = path.join(migrations_folder, i);
        let functions = require(file_path);
        return {...{name: i}, ...functions};
      });

      const umzug = new Umzug({
        migrations: migrations_list,
        context: sequelize.getQueryInterface(),
        storage: new SequelizeStorage({
          sequelize: sequelize
        }),
        logger: console,
      });

      await umzug.up();
      console.log('\x1b[32m%s\x1b[0m', '✅ Migrations applied');
    }

    await sequelize.query('PRAGMA journal_mode = WAL');
    await sequelize.query('PRAGMA synchronous = NORMAL');
    await sequelize.query('PRAGMA temp_store = MEMORY');
    await sequelize.query('PRAGMA cache_size = -64000');
  } catch (migrationError) {
    console.log('\x1b[33m%s\x1b[0m', '⚠️ Migration error:', migrationError.message);
  }
}).catch(err => {
  console.log('\x1b[33m%s\x1b[0m', '⚠️ Database sync error:', err.message);
});

// Warm up the local parser model in the background. If a bundled model exists,
// it is used immediately; otherwise Transformers will populate app_storage/models.
try {
  const embeddingModel = require('../api/services/embeddingModel')
  embeddingModel.loadModel(db).catch(err => {
    console.log('\x1b[33m%s\x1b[0m', '⚠️ Parser model warmup skipped:', err.message);
  })
} catch (err) {
  console.log('\x1b[33m%s\x1b[0m', '⚠️ Parser model warmup unavailable:', err.message);
}

// ==================== API ENDPOINTS ====================
const routeFiles = [
  "PinnedMeta.routes",
  "Home.routes",
  "FilterRow.routes",
  "FilterRowsInSavedFilter.routes",
  "Tag.routes",
  "TagsInFilterRow.routes",
  "TagsInTag.routes",
  "TagsInMedia.routes",
  "Mark.routes",
  "Media.routes",
  "Playlist.routes",
  "MediaInPlaylists.routes",
  "MediaType.routes",
  "Meta.routes",
  "MetaInMediaType.routes",
  "MediaTypesInWatchedFolders.routes",
  "MetaSetting.routes",
  "PageSetting.routes",
  "SavedFilter.routes",
  "Setting.routes",
  "Tab.routes",
  "Task.routes",
  "tasks/TasksBackups.routes",
  "ValuesInTag.routes",
  "ValuesInMedia.routes",
  "VideoMetadata.routes",
  "WatchedFolder.routes"
];

routeFiles.forEach(routeFile => {
  try {
    require(`../api/routes/${routeFile}`)(app, db);
  } catch (err) {
    console.log('\x1b[33m%s\x1b[0m', `⚠️ Route ${routeFile} not found:`, err.message);
  }
});

// ==================== FILE UTILITIES ====================
const {normalizeMediaPath} = require('../api/utils/normalizeUserPath')
const {pathVariants} = require('../api/services/contentHash')

function resolveFilePath(filePath) {
  if (!filePath) return null;

  console.log('Resolving file path:', filePath);

  const normalizedPath = normalizeMediaPath(filePath)

  for (const variant of pathVariants(normalizedPath)) {
    if (fs.existsSync(variant)) {
      return variant;
    }
  }

  // If the path is absolute, check it
  if (path.isAbsolute(normalizedPath)) {
    // Check if the file exists at the absolute path
    if (fs.existsSync(normalizedPath)) {
      return normalizedPath;
    }

    // Look for database ID in the path
    const dbIdRegex = /databases\/([a-f0-9]{12})/;
    const match = normalizedPath.match(dbIdRegex);

    if (match) {
      const dbIdInPath = match[1];
      // Check if such a database exists
      const dbExists = config.databases.find(db => db.id === dbIdInPath);

      if (dbExists) {
        // File not found in the specified database, but the database exists
        console.log(`Database in path exists: ${dbIdInPath}, but file not found`);
      }
    }
  }

  // If the path is relative or the file was not found, try the active database
  const activeDb = config.databases.find(db => db.active);
  if (activeDb) {
    // Remove possible path prefixes
    const cleanPath = normalizedPath.replace(/^\/+/, '').replace(/^.*databases\/[a-f0-9]+\//, '');

    const possiblePaths = [
      path.join(databasesPath, activeDb.id, 'media', cleanPath),
      path.join(databasesPath, activeDb.id, cleanPath),
      path.join(databasesPath, activeDb.id, 'meta', cleanPath)
    ];

    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        console.log(`File found at path: ${possiblePath}`);
        return possiblePath;
      }
    }
  }

  // Try to find the file in all databases
  for (const db of config.databases) {
    const cleanPath = normalizedPath.replace(/^\/+/, '').replace(/^.*databases\/[a-f0-9]+\//, '');

    const possiblePaths = [
      path.join(databasesPath, db.id, 'media', cleanPath),
      path.join(databasesPath, db.id, cleanPath),
      path.join(databasesPath, db.id, 'meta', cleanPath)
    ];

    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        console.log(`File found in database ${db.name} (${db.id}): ${possiblePath}`);
        return possiblePath;
      }
    }
  }

  console.log(`File not found: ${normalizedPath}`);
  return null;
}

// ==================== SPECIAL ENDPOINTS ====================
app.get('/api/health', (req, res) => {
  console.log('Health check from:', req.headers.origin || 'unknown origin');
  res.json({
    status: 'online',
    service: 'mediachips-server',
    version: package_json.version,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    ip: 'localhost',
    port: config.port
  });
});

app.get('/api/ping', (req, res) => {
  res.json({
    pong: Date.now(),
    ip: 'localhost',
    port: config.port,
    message: 'Server is online'
  });
});

app.get('/api/config', (req, res) => {
  console.log('Config request from:', req.headers.origin || 'unknown origin');

  const activeDb = config.databases.find(db => db.active);
  const requestHostname = req.hostname;
  const frontendIp = requestHostname && !isLoopbackHost(requestHostname)
    ? requestHostname
    : config.ip;

  const responseConfig = {
    ip: frontendIp,
    ips: config.ips,
    hostname: config.hostname,
    port: config.port,
    appVersion: package_json.version || '1.0.0',
    path: activeDb ? path.join(databasesPath, activeDb.id) : '',
    databases: config.databases || [],
    activeDatabase: activeDb,
    serverInfo: {
      webUrl: `http://${frontendIp}:${config.port}`,
      apiUrl: `http://${frontendIp}:${config.port}/api`,
      wsUrl: `ws://${frontendIp}:${config.port}`,
      detectedAt: new Date().toISOString()
    }
  };

  res.json(responseConfig);
});

app.post('/api/update-config', (req, res) => {
  config = {...config, ...req.body};

  // Update path if the active database changed
  const activeDb = config.databases.find(db => db.active);
  if (activeDb) {
    config.path = path.join(databasesPath, activeDb.id);
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('\x1b[36m%s\x1b[0m', `Config updated. Active database: ${activeDb?.name || 'none'}`);

  res.json({ success: true, message: 'Configuration updated' });
});

// IMPORTANT: Fixed endpoint for retrieving files
app.post('/api/get-file', (req, res) => {
  console.log('=== FILE REQUEST ===');
  console.log('Request body:', req.body);

  const originalFilePath = req.body.url;

  if (!originalFilePath) {
    return res.status(400).json({ error: 'No file path provided' });
  }

  try {
    // Resolve file path
    const resolvedPath = resolveFilePath(originalFilePath);

    if (!resolvedPath) {
      console.error('File not found:', originalFilePath);
      return res.status(404).json({
        error: 'File not found',
        resolved: false
      });
    }

    console.log('Sending file:', resolvedPath);

    // Determine MIME type
    const ext = path.extname(resolvedPath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    // Send file
    res.sendFile(resolvedPath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        try {
          const stats = fs.statSync(resolvedPath);
          const fileStream = fs.createReadStream(resolvedPath);
          res.setHeader('Content-Length', stats.size);
          fileStream.pipe(res);
        } catch (streamErr) {
          res.status(500).json({ error: 'File stream error', details: streamErr.message });
        }
      }
    });
  } catch (err) {
    console.error('Error processing file:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.post('/api/check-file', (req, res) => {
  const filePath = req.body.url;

  if (!filePath) {
    return res.json({ exists: false, error: 'No path provided' });
  }

  const resolvedPath = resolveFilePath(filePath);
  res.json({
    exists: !!resolvedPath
  });
});

// New endpoint for switching databases
app.post('/api/switch-database', (req, res) => {
  const { databaseId } = req.body;

  if (!databaseId) {
    return res.status(400).json({ error: 'Database ID required' });
  }

  const database = config.databases.find(db => db.id === databaseId);
  if (!database) {
    return res.status(404).json({ error: 'Database not found' });
  }

  // Deactivate all databases
  config.databases.forEach(db => {
    db.active = false;
  });

  // Activate the selected one
  database.active = true;
  config.path = path.join(databasesPath, database.id);

  // Save config
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  res.json({
    success: true,
    message: `Database switched to ${database.name}`,
    databaseId: database.id,
    databaseName: database.name
  });
});

// Endpoint for retrieving path information
app.post('/api/resolve-path', (req, res) => {
  const { filePath } = req.body;

  if (!filePath) {
    return res.json({ error: 'No file path provided' });
  }

  const resolvedPath = resolveFilePath(filePath);
  const normalizedPath = normalizeMediaPath(filePath);

  // Check all databases
  const results = [];
  for (const db of config.databases) {
    const cleanPath = normalizedPath.replace(/^\/+/, '').replace(/^.*databases\/[a-f0-9]+\//, '');

    const possiblePaths = [
      path.join(databasesPath, db.id, 'media', cleanPath),
      path.join(databasesPath, db.id, cleanPath),
      path.join(databasesPath, db.id, 'meta', cleanPath)
    ];

    for (const possiblePath of possiblePaths) {
      const exists = fs.existsSync(possiblePath);
      if (exists) {
        results.push({
          databaseId: db.id,
          databaseName: db.name,
          active: db.active,
          exists: true
        });
      }
    }
  }

  res.json({
    exists: !!resolvedPath,
    results: results
  });
});

router.get('/api/video/:id', (req, res) => {
  db.Media.findOne({
    where: { id: req.params.id }
  }).then(video => {
    if (!video || !video.path) {
      return res.status(404).json({ message: "Video not found in database" });
    }

    const videoPath = resolveFilePath(video.path);
    if (!videoPath || !fs.existsSync(videoPath)) {
      return res.status(404).json({
        message: "Video file doesn't exist"
      });
    }

    const videoStat = fs.statSync(videoPath);
    const fileSize = videoStat.size;
    const videoRange = req.headers.range;

    if (videoRange) {
      const parts = videoRange.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });

      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };

      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  }).catch(err => {
    console.error('Video streaming error:', err);
    res.status(500).json({ message: err.message || "Database error" });
  });
});

// ==================== STATIC FILES ====================
const src = path.join(__dirname, '../dist');
app.use(express.static(src));

app.use(history({
  disableDotRule: true,
  verbose: false,
  rewrites: [
    {
      from: /^\/api\/.*$/,
      to: function(context) {
        return context.parsedUrl.pathname;
      }
    },
    {
      from: /^\/socket\.io\/.*$/,
      to: function(context) {
        return context.parsedUrl.pathname;
      }
    }
  ]
}));

// ==================== WEB SOCKETS ====================
try {
  require("./tasks/websockets")(app, db);
} catch (err) {
  console.log('\x1b[33m%s\x1b[0m', '⚠️ WebSocket module not found:', err.message);
}

// ==================== SERVER STARTUP ====================
let listener;

// Function to show a system notification (if running in Electron)
function showSystemNotification(title, message) {
  // Check if the app is running in Electron
  const isElectron = process.versions['electron'];

  if (isElectron) {
    try {
      // Use Electron dialog to show a system window
      const { dialog } = require('electron');
      dialog.showErrorBox(title, message);
    } catch (err) {
      console.error('Failed to show system dialog:', err);
      // Fallback - use console.error
      console.error(`\x1b[31m${title}: ${message}\x1b[0m`);
    }
  } else {
    // If not in Electron, print to console with bright formatting
    console.error('\n' + '='.repeat(70));
    console.error('\x1b[41m\x1b[37m%s\x1b[0m', ` ${title} `);
    console.error('\x1b[31m%s\x1b[0m', message);
    console.error('='.repeat(70) + '\n');

    // Additional visual effect in the terminal
    console.log('\x1b[33m%s\x1b[0m', '💡 Possible solutions:');
    console.log('\x1b[33m%s\x1b[0m', `   1. Close other applications using port ${FIXED_PORT}`);
    console.log('\x1b[33m%s\x1b[0m', `   2. Find the process using the port: lsof -i :${FIXED_PORT}`);
    console.log('\x1b[33m%s\x1b[0m', `   3. Kill the process: kill -9 <PID>`);
    console.log('\x1b[33m%s\x1b[0m', `   4. Restart your computer`);
  }
}

// Function to check if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const tester = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .once('listening', () => {
        tester.once('close', () => {
          resolve(false);
        }).close();
      })
      .listen(port, BIND_HOST);
  });
}

const startServer = async () => {
  const portToUse = FIXED_PORT;

  // Check if the port is already in use before starting
  const portBusy = await isPortInUse(portToUse);

  if (portBusy) {
    const errorTitle = 'Application startup error';
    const errorMessage = `Port ${portToUse} is already in use by another application.\n\nPlease close other applications using this port and restart the application.`;

    // Show system dialog
    showSystemNotification(errorTitle, errorMessage);

    // Exit process with error
    process.exit(1);
    return;
  }

  console.log('\n' + '='.repeat(70));
  console.log('\x1b[33m%s\x1b[0m', `🚀 Starting server on ${BIND_HOST}:${portToUse}...`);

  listener = app.listen(portToUse, BIND_HOST, () => {
    const actualPort = listener.address().port;

    const bestIp = getBestLocalIp();
    config.ip = ALLOW_LAN ? bestIp : 'localhost';
    config.ips = ALLOW_LAN ? getAllIps().map(ip => ip.address) : [];
    config.hostname = ALLOW_LAN ? os.hostname() : 'localhost';
    config.port = actualPort;

    // Update path to active database
    const activeDb = config.databases.find(db => db.active);
    if (activeDb) {
      config.path = path.join(databasesPath, activeDb.id);
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log('\x1b[32m%s\x1b[0m', '✅ Server started successfully!');
    console.log('='.repeat(70));

    console.log('\x1b[36m%s\x1b[0m', '📊 Server information:');
    console.log('\x1b[36m%s\x1b[0m', `   • Host:            ${config.hostname}`);
    console.log('\x1b[36m%s\x1b[0m', `   • Port:            ${actualPort}`);
    console.log('\x1b[36m%s\x1b[0m', `   • Primary IP:      ${bestIp}`);
    console.log('\x1b[36m%s\x1b[0m', `   • All IPs:         ${config.ips.join(', ')}`);
    console.log('\x1b[36m%s\x1b[0m', `   • Version:         ${package_json.version}`);

    if (activeDb) {
      console.log('\x1b[36m%s\x1b[0m', `   • Active database: ${activeDb.name} (${activeDb.id})`);
    }

    console.log('\n\x1b[36m%s\x1b[0m', '🌐 Available addresses:');
    console.log('\x1b[36m%s\x1b[0m', `   1. Local machine:`);
    console.log('\x1b[36m%s\x1b[0m', `      → http://localhost:${actualPort}`);
    console.log('\x1b[36m%s\x1b[0m', `      → http://127.0.0.1:${actualPort}`);

    if (ALLOW_LAN && config.ips && config.ips.length > 0) {
      console.log('\x1b[36m%s\x1b[0m', `   2. Local network:`);
      config.ips.forEach((ip, index) => {
        const iface = getAllIps()[index]?.interface || 'interface';
        console.log('\x1b[36m%s\x1b[0m', `      → http://${ip}:${actualPort} (${iface})`);
      });
    } else {
      console.log('\x1b[36m%s\x1b[0m', `   2. Local network: disabled (set MEDIA_CHIPS_ALLOW_LAN=1 to enable)`);
    }

    console.log('\n\x1b[36m%s\x1b[0m', '🔧 API Endpoints:');
    console.log('\x1b[36m%s\x1b[0m', `   • Health check:   http://localhost:${actualPort}/api/health`);
    console.log('\x1b[36m%s\x1b[0m', `   • Server config:  http://localhost:${actualPort}/api/config`);
    console.log('\x1b[36m%s\x1b[0m', `   • Get file:       http://localhost:${actualPort}/api/get-file`);

    console.log('\n\x1b[7m%s\x1b[0m', `✨ Open in browser: http://localhost:${actualPort}`);
    console.log('='.repeat(70));

    config.appVersion = package_json.version;

    process.server_config = config;
  });

  listener.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const errorTitle = 'Application startup error';
      const errorMessage = `Port ${portToUse} is already in use by another application.\n\nPlease close other applications using this port and restart the application.`;

      console.log('\x1b[31m%s\x1b[0m', `❌ Port ${portToUse} is already in use!`);
      showSystemNotification(errorTitle, errorMessage);
      process.exit(1);
    } else {
      console.log('\x1b[31m%s\x1b[0m', '❌ Server error:', err);
      showSystemNotification('Server error', err.message);
      process.exit(1);
    }
  });
};

startServer();

// ==================== EXPORTS ====================
module.exports = {
  config: config,
  app: app,
  listener: listener,
  resolveFilePath: resolveFilePath
};

global.serverConfig = config;
global.serverApp = app;

process.on('SIGINT', () => {
  console.log('\n\x1b[33m%s\x1b[0m', '🛑 Stopping server...');
  if (listener) {
    listener.close(() => {
      console.log('\x1b[32m%s\x1b[0m', '✅ Server stopped');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});