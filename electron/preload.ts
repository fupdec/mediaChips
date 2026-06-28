const {
  contextBridge,
  ipcRenderer,
  webUtils,
} = require('electron');
const os = require('os');

// Белый список каналов для безопасности
const validSendChannels = [
  'open-player',
  'getItemsFromDb',
  'updateVideoFrames',
  'removeEntitiesFromState',
  'stop-playing-video',
  'setFullScreen',
  'player-ready',
  'setNotification',
  'maximize',
  'unmaximize',
  'enter-full-screen',
  'leave-full-screen',
  'blur',
  'focus',
  'config',
  'closeApp',
];

const validInvokeChannels = [
  'openPath',
  'showOpenDialog',
  'getDateForDB',
  'get-config',
  'get-machine-id',
  'dialog:openFile',
  'dialog:saveFile',
  'deleteLocalFile',
  'createThumb',
  'setNotification',
  'maximize',
  'unmaximize',
  'minimize',
  'relaunch',
  'closePlayer',
  'toggleDevTools',
  'updater:check',
  'updater:download',
  'updater:install',
  'updater:get-state',
  'updater:is-supported',
  'setZoomFactor',
  'getZoomFactor',
];

const validOnChannels = [
  'play-video',
  'getItemsFromDb',
  'updateVideoFrames',
  'removeEntitiesFromState',
  'stop-playing-video',
  'config',
  'maximize',
  'unmaximize',
  'enter-full-screen',
  'leave-full-screen',
  'blur',
  'focus',
  'aboutApp',
  'lockApp',
  'navigationBack',
  'navigationForward',
  'updater:status',
  'zoom-changed',
];

type PlayVideoListener = (event: unknown, data: unknown) => void

const listenerSubscriptions = new Map()
let pendingPlayVideo: unknown = null
const playVideoListeners = new Set<PlayVideoListener>()

ipcRenderer.on('play-video', (event, ...args) => {
  const data = args.length > 0 ? args[0] : null;
  if (playVideoListeners.size === 0) {
    pendingPlayVideo = data;
    return;
  }

  for (const callback of playVideoListeners) {
    callback(event, data);
  }
});

// Экспортируем API с разными пространствами имен
contextBridge.exposeInMainWorld('electronAPI', {
  // Для отправки сообщений
  send: (channel, data) => {
    if (validSendChannels.includes(channel)) {
      console.log(`[IPC] Sending to ${channel}:`, data);
      ipcRenderer.send(channel, data);
    } else {
      console.warn(`[IPC] Blocked attempt to send to channel: ${channel}`);
    }
  },

  getPathForFile: (file) => {
    if (!file) return ''

    try {
      return webUtils.getPathForFile(file)
    } catch (error) {
      console.warn('[IPC] getPathForFile failed:', error)
      return file.path || ''
    }
  },

  // Для вызова с ожиданием ответа
  invoke: (channel, data) => {
    if (validInvokeChannels.includes(channel)) {
      console.log(`[IPC] Invoking ${channel}:`, data);

      // Специальная обработка для showOpenDialog
      if (channel === 'showOpenDialog') {
        // Убеждаемся, что передаем массив
        if (!Array.isArray(data)) {
          console.warn('[IPC] showOpenDialog: data должен быть массивом, преобразую...');
          if (typeof data === 'string') {
            data = [data];
          } else if (typeof data === 'object' && data !== null) {
            data = Object.keys(data).filter(key => data[key] === true);
          } else {
            data = [];
          }
        }
      }

      return ipcRenderer.invoke(channel, data);
    }
    console.warn(`[IPC] Blocked attempt to invoke channel: ${channel}`);
    return Promise.reject(new Error(`Channel ${channel} is not allowed`));
  },

  // Для получения сообщений
  on: (channel, callback) => {
    if (validOnChannels.includes(channel)) {
      console.log(`[IPC] Setting up listener for ${channel}`);

      // Создаем специальный обработчик для play-video
      if (channel === 'play-video') {
        const subscription = (event, data) => {
          callback(event, data);
        };
        playVideoListeners.add(subscription);
        listenerSubscriptions.set(callback, {channel, subscription, isPlayVideo: true});

        if (pendingPlayVideo !== null) {
          const buffered = pendingPlayVideo;
          pendingPlayVideo = null;
          callback(null, buffered);
        }

        return () => {
          playVideoListeners.delete(subscription);
          listenerSubscriptions.delete(callback);
        };
      } else {
        // Для остальных каналов передаем как есть
        const subscription = (event, ...args) => {
          console.log(`[IPC] Received from ${channel}:`, args);
          callback(...args);
        };
        ipcRenderer.on(channel, subscription);
        listenerSubscriptions.set(callback, {channel, subscription});

        return () => {
          ipcRenderer.removeListener(channel, subscription);
          listenerSubscriptions.delete(callback);
        };
      }
    }
    console.warn(`[IPC] Blocked attempt to listen to channel: ${channel}`);
    return () => {};
  },

  removeListener: (channel, callback) => {
    const entry = listenerSubscriptions.get(callback);
    if (entry && entry.channel === channel) {
      if (entry.isPlayVideo) {
        playVideoListeners.delete(entry.subscription);
      } else {
        ipcRenderer.removeListener(channel, entry.subscription);
      }
      listenerSubscriptions.delete(callback);
    }
  },

  // Для получения одного сообщения
  once: (channel, callback) => {
    if (validOnChannels.includes(channel)) {
      // Специальная обработка для play-video
      if (channel === 'play-video') {
        ipcRenderer.once(channel, (event, ...args) => {
          callback(event, args.length > 0 ? args[0] : null);
        });
      } else {
        ipcRenderer.once(channel, (event, ...args) => callback(...args));
      }
    }
  },

  updater: {
    check: () => ipcRenderer.invoke('updater:check'),
    download: () => ipcRenderer.invoke('updater:download'),
    install: () => ipcRenderer.invoke('updater:install'),
    getState: () => ipcRenderer.invoke('updater:get-state'),
    isSupported: () => ipcRenderer.invoke('updater:is-supported'),
    onStatus: (callback) => {
      const subscription = (_event, payload) => callback(payload)
      ipcRenderer.on('updater:status', subscription)
      return () => ipcRenderer.removeListener('updater:status', subscription)
    },
  },
});

// Экспортируем утилиты как отдельные глобальные объекты
contextBridge.exposeInMainWorld('operableAPI', {
  openPath: (path) => ipcRenderer.invoke('openPath', path),
  checkFileExists: (path) => ipcRenderer.invoke('checkFileExists', path),
  deleteLocalFile: (path) => ipcRenderer.invoke('deleteLocalFile', path),
  createThumb: (time, videoPath, imgPath, width) =>
    ipcRenderer.invoke('createThumb', { time, videoPath, imgPath, width }),
  setNotification: (notification) => ipcRenderer.invoke('setNotification', notification)
});

contextBridge.exposeInMainWorld('readableAPI', {
  getDateForDB: () => ipcRenderer.invoke('getDateForDB')
});

// Экспортируем безопасные свойства OS
contextBridge.exposeInMainWorld('osAPI', {
  platform: os.platform(),
  homedir: os.homedir(),
  tmpdir: os.tmpdir(),
  arch: os.arch(),
  type: os.type(),
  version: os.version()
});

// Экспортируем версию
contextBridge.exposeInMainWorld('appInfo', {
  version: process.versions.electron,
  node: process.versions.node,
  chrome: process.versions.chrome
});

// Для обратной совместимости с существующим кодом
contextBridge.exposeInMainWorld('os', {
  type: () => os.type(),
  platform: () => os.platform(),
  homedir: () => os.homedir()
});

// Единый API для удобства (если $operable уже определен плагином, это не перезапишет его)
contextBridge.exposeInMainWorld('$electronOperable', {
  openPath: (path, wait = false) => {
    if (typeof path === 'string') {
      return ipcRenderer.invoke('openPath', { path, wait });
    }
    return ipcRenderer.invoke('openPath', path);
  },
  checkFileExists: (path, skipDir = false) => {
    if (typeof path === 'string') {
      return ipcRenderer.invoke('checkFileExists', { path, skipDir });
    }
    return ipcRenderer.invoke('checkFileExists', path);
  },
  deleteLocalFile: (path) => ipcRenderer.invoke('deleteLocalFile', path),
  createThumb: (time, videoPath, imgPath, width) =>
    ipcRenderer.invoke('createThumb', { time, videoPath, imgPath, width }),
  setNotification: (notification) => ipcRenderer.invoke('setNotification', notification),
  showOpenDialog: (properties) => {
    // Убеждаемся, что передаем массив
    if (!Array.isArray(properties)) {
      console.warn('[IPC] showOpenDialog: преобразую свойства в массив...');
      if (typeof properties === 'string') {
        properties = [properties];
      } else if (typeof properties === 'object' && properties !== null) {
        properties = Object.keys(properties).filter(key => properties[key] === true);
      } else {
        properties = ['openDirectory'];
      }
    }
    return ipcRenderer.invoke('showOpenDialog', properties);
  },
  getDateForDB: () => ipcRenderer.invoke('getDateForDB')
});