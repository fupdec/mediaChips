<template>
  <AutoConnect
    v-if="!isConnected"
    @connected="handleServerConnected"
    @manual-mode="showManual = true"
  ></AutoConnect>
  <app-preloader v-else-if="isConfigLoaded"/>
</template>

<script setup>
import {ref, onMounted, provide, watch} from "vue"
import AppPreloader from "@/AppPreloader.vue"
import path from "path-browserify"
import {useAppStore} from "@/stores/app"
import AutoConnect from "@/AutoConnect.vue";

const isConfigLoaded = ref(false)
const app = useAppStore()

const isConnected = ref(false);
const currentServer = ref(null);
const showManual = ref(false);

// Check if we are in player window
const isPlayerWindow = ref(window.location.search.includes('player=true'));

// Make current server available to all components
provide('currentServer', currentServer);

onMounted(() => {
  const currentOriginServer = getCurrentOriginServer()
  if (currentOriginServer) {
    console.log('🌐 Using current origin as server:', currentOriginServer.url);
    handleServerConnected(currentOriginServer);
    return;
  }

  // If this is a player window, use simpler connection logic
  if (isPlayerWindow.value) {
    console.log('🔵 Player window: skipping auto-connect');
    // For player, use localhost immediately
    const serverInfo = {
      url: 'http://localhost:' + (import.meta.env.VITE_PORT || 12321),
      ip: 'localhost'
    };
    handleServerConnected(serverInfo);
    return;
  }

  // Try to restore last connection (main window only)
  const lastServer = localStorage.getItem('lastServer');
  if (lastServer) {
    try {
      const server = JSON.parse(lastServer);
      // Quick availability check
      checkServerAvailability(server).then(available => {
        if (available) {
          handleServerConnected(server);
        }
      });
    } catch (e) {
      console.warn('Failed to restore connection:', e);
    }
  }
});

function getCurrentOriginServer() {
  const fixedPort = String(import.meta.env.VITE_PORT || 12321)

  if (!['http:', 'https:'].includes(window.location.protocol)) {
    return null
  }

  // Vite dev server runs on a different port, so only accept the app server.
  if (window.location.port !== fixedPort) {
    return null
  }

  return {
    url: window.location.origin,
    ip: window.location.hostname || 'localhost'
  }
}

async function checkServerAvailability(server) {
  try {
    const response = await fetch(`${server.url}/api/ping`, {
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch (error) {
    console.warn('Server unavailable:', error);
    return false;
  }
}

function handleServerConnected(serverInfo) {
  currentServer.value = serverInfo;
  isConnected.value = true;

  // Save connection for main window
  if (!isPlayerWindow.value) {
    localStorage.setItem('lastServer', JSON.stringify(serverInfo));
  }

  // Initialize app with this server
  initializeApp(serverInfo);
}

function initializeApp(server) {
  console.log('🚀 Initializing app with server:', server.ip);
  // Configure axios or other HTTP client
  // Load configuration
  loadConfig();
}

function loadConfig() {
  // --- Electron mode ---
  if (window.electronAPI) {
    console.log('⏳ Waiting for config from electronAPI...');

    // Set up config event handler
    window.electronAPI.on("config", (config) => {
      console.log('✅ Config received from Electron');
      applyConfig(config);
    });

    // Add timeout in case event doesn't arrive
    setTimeout(() => {
      if (!isConfigLoaded.value) {
        console.warn('⚠️ Config not received due to timeout');
        // For player, try to get config another way
        if (isPlayerWindow.value) {
          fetchConfigFromServer();
        }
      }
    }, 5000);

    // --- Browser mode ---
  } else {
    console.log('🌐 Browser mode: loading config from server');
    fetchConfigFromServer();
  }
}

async function fetchConfigFromServer() {
  try {
    console.log('🔄 Requesting config from server...');
    // Use current server URL or localhost for player
    const baseUrl = currentServer.value?.url || `http://localhost:${import.meta.env.VITE_PORT || 12321}`;
    const response = await fetch(`${baseUrl}/api/config`);

    if (response.ok) {
      const config = await response.json();
      applyConfig(config);
    } else {
      console.error('❌ Error getting config');
      // For player, try again after 2 seconds
      if (isPlayerWindow.value) {
        setTimeout(fetchConfigFromServer, 2000);
      }
    }
  } catch (error) {
    console.error('❌ Network error while getting config:', error);
    // Retry for player
    if (isPlayerWindow.value) {
      setTimeout(fetchConfigFromServer, 2000);
    }
  }
}

function applyConfig(config) {
  app.localhost = `http://${config.ip}:${config.port}`
  app.appVersion = config.appVersion
  app.dbPath = config.path
  app.mediaPath = path.join(config.path, "media")
  app.databases = config.databases
  app.config = config

  console.log('✅ Config applied:', config)
  isConfigLoaded.value = true
}

function reconnect() {
  isConnected.value = false;
  currentServer.value = null;
  isConfigLoaded.value = false;
}

// Periodic connection check (main window only)
if (!isPlayerWindow.value) {
  setInterval(() => {
    if (isConnected.value && currentServer.value) {
      checkServerAvailability(currentServer.value).then(available => {
        if (!available) {
          console.warn('⚠️ Connection to server lost');
          isConnected.value = false;
          // Attempt reconnection
          setTimeout(() => {
            const lastServer = localStorage.getItem('lastServer');
            if (lastServer) {
              try {
                const server = JSON.parse(lastServer);
                checkServerAvailability(server).then(available => {
                  if (available) {
                    handleServerConnected(server);
                  }
                });
              } catch (e) {
                // Handle error
              }
            }
          }, 5000);
        }
      });
    }
  }, 30000);
}
</script>