const {
  contextBridge,
  ipcRenderer
} = require('electron');
const os = require('os');

// Белый список каналов для безопасности
const validSendChannels = [
  'open-player',
  'getItemsFromDb',
  'removeEntitiesFromState',
  'stop-playing-video',
  'setFullScreen',
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

const listenerSubscriptions = new Map();

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
        const subscription = (event, ...args) => {
          console.log(`[IPC] Received from ${channel}:`, args);
          // Для play-video передаем event и первый аргумент как данные
          if (args.length > 0) {
            callback(event, args[0]); // Передаем event и данные
          } else {
            callback(event, null); // Или event и null если нет данных
          }
        };
        ipcRenderer.on(channel, subscription);
        listenerSubscriptions.set(callback, {channel, subscription});

        return () => {
          ipcRenderer.removeListener(channel, subscription);
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
      ipcRenderer.removeListener(channel, entry.subscription);
      listenerSubscriptions.delete(callback);
    }
  },

  // Для получения одного сообщения
  once: (channel, callback) => {
    if (validOnChannels.includes(channel)) {
      // Специальная обработка для play-video
      if (channel === 'play-video') {
        ipcRenderer.once(channel, (event, ...args) => {
          if (args.length > 0) {
            callback(event, args[0]);
          } else {
            callback(event, null);
          }
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