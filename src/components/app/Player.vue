<template>
  <v-dialog
    @update:model-value="closePlayer"
    :model-value="isActive"
    :persistent="isPlayerWindow"
    :content-class="isPlayerWindow?'player-separate-window':'dialog-player'"
    width="2000"
    no-click-animation
    eager
  >
    <div
      @mousedown="stopSmoothScroll($event)"
      @mousemove="moveOverPlayer"
      :class="{ fullscreen: player.fullscreen , 'no-cursor':!player.isControlsVisible}"
      class="player"
      ref="player"
      id="player"
    >
      <SystemBarPlayer
        v-if="isPlayerWindow"
        v-show="!player.fullscreen"
      ></SystemBarPlayer>

      <div class="player-wrapper">
        <v-btn v-if="!isPlayerWindow && !player.fullscreen"
          @click="closePlayer"
          class="player-close-btn"
          variant="text"
          color="white"
          size="x-small"
          icon
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>

        <div
          @click="togglePause"
          @dblclick="toggleFullscreen"
          @click.middle="toggleFullscreen"
          @mousedown="clickOnVideo($event)"
          @wheel="changeVolume"
          tabindex="-1"
          class="video-wrapper"
        >
          <video ref="videoPlayer"
            autoplay/>

          <div v-if="isReady && player.playbackError && reg"
            class="video-error">
            <v-alert color="error"
              text>
              <v-icon size="24"
                color="error"
                left>mdi-alert
              </v-icon>
              {{ t('common.error') }}:
              <div class="filename"
                v-text="t('player.file') + ' ' + currentPlaying"></div>
              <div v-if="player.is_file_exists">{{ t('player.video_format_not_supported') }}
              </div>
              <div v-else>{{ t('player.file_is_missing') }}</div>
            </v-alert>
            <v-btn v-if="player.is_file_exists"
              @click.stop="openPath"
              class="mt-4"
              color="primary"
              rounded>
              <v-icon left>mdi-play-circle-outline</v-icon>
              <span>{{ t('actions.open_system_player') }}</span>
            </v-btn>
            <v-btn @click.stop="nextVideo"
              class="mt-4"
              color="primary"
              rounded>
              <v-icon left>mdi-skip-next</v-icon>
              <span>{{ t('actions.play_next_video') }}</span>
            </v-btn>
          </div>

          <div v-if="!reg && player.nowPlaying > 14"
            class="reg-block">
            <div class="mb-2">{{ t('registration.application_not_registered') }}</div>
            <div class="caption">
              {{ t('registration.unregistered_playlist_limit') }}
            </div>
          </div>

          <div v-show="player.statusText"
            class="status-text">
            <v-icon dark
              start>mdi-{{ player.statusIcon }}
            </v-icon>
            {{ player.statusText }}
          </div>
        </div>

        <Controls
          @toggleFullscreen="toggleFullscreen"
          @togglePictureInPicture="togglePictureInPicture"
          @play="playVideoObject($event)"
          @changeVolume="changeVolume($event)"
          @showControls="showControls"
          @addMark="openAddingMark"
          @removeMark="removeMark"
          @close="closePlayer"
          @updateVideo="updateItemVideo"
          ref="controls"
        />
      </div>
      <Playlist @play="playVideoObject($event)"/>
      <Marks @removeMark="removeMark"
        ref="marks"/>
      <DialogMarkAdding
        v-if="dialogsStore.markAdding.show"
        @togglePause="togglePause"
        @addMark="addMark($event)"
      />
    </div>
  </v-dialog>
</template>

<script setup>
import {ref, computed, onMounted, onBeforeUnmount, watch, nextTick} from 'vue'
import {useI18n} from 'vue-i18n'
import {useAppStore} from '@/stores/app'
import {usePlayerStore} from '@/stores/player'
import {useSettingsStore} from '@/stores/settings'
import {useDialogsStore} from '@/stores/dialogs'
import {useRegistrationStore} from '@/stores/registration'
import {useItemsStore} from '@/stores/items'
import axios from 'axios'
import _ from 'lodash'
import Controls from '@/components/app/player/Controls.vue'
import Playlist from '@/components/app/player/Playlist.vue'
import Marks from '@/components/app/player/Marks.vue'
import SystemBarPlayer from '@/components/app/SystemBarPlayer.vue'
import DialogMarkAdding from '@/components/dialogs/DialogMarkAdding.vue'
import {useEventBus} from '@/utils/eventBus'
import path from "path-browserify"
import {useRoute} from "vue-router";
import {getDefaultMediaTypeId} from '@/utils/mediaType'

const appStore = useAppStore()
const playerStore = usePlayerStore()
const settingsStore = useSettingsStore()
const dialogsStore = useDialogsStore()
const registrationStore = useRegistrationStore()
const itemsStore = useItemsStore()
const eventBus = useEventBus()
const route = useRoute()
const {t} = useI18n()

const emit = defineEmits(['close'])

// Refs
const isReady = ref(null)
const videoPlayer = ref(null)
const controls = ref(null)
const marks = ref(null)
const timeoutControls = ref(-1)

// Computed
const player = computed(() => playerStore)
const isPlayerWindow = computed(() => !!route.query.player)
const isActive = computed(() => isPlayerWindow.value || playerStore.active)
const SETTINGS = computed(() => settingsStore)
const reg = computed(() => registrationStore)
const video = computed(() => playerStore.playlist[playerStore.nowPlaying])
const currentPlaying = computed(() => video.value ? video.value.name : "")
const apiUrl = computed(() => appStore.localhost)
const os = computed(() => window.os ? window.os.type() : false)

// Methods
const closePlayer = async () => {
  if (video.value) {
    await updatePlaybackTime(video.value)
  }

  if (playerStore.player) {
    playerStore.player.pause()
    playerStore.player.src = null
  }

  playerStore.currentTime = 0
  playerStore.active = false
  playerStore.paused = false
  window.removeEventListener("keydown", handleKey)
}

const initPlayer = () => {
  if (!playerStore.player) return
  isReady.value = false

  playerStore.player.addEventListener("loadedmetadata", () => {
    playerStore.duration = playerStore.player.duration
  })

  playerStore.player.addEventListener("ended", () => {
    if (playerStore.playlistMode.includes("autoplay") && controls.value) {
      controls.value.next()
    }
  })

  playerStore.player.addEventListener("error", () => {
    playerStore.playbackError = true
  })
}

const loadSrc = async (video, start_time) => {
  // проверяем есть ли файл в системе
  playerStore.is_file_exists = await $operable.checkFileExists(video.path)

  if (!playerStore.is_file_exists) {
    console.error('Player: File does not exist:', video.path)
    playerStore.playbackError = true
    return
  }

  // подргужаем соурс и получаем данные о видео
  playerStore.player.src = apiUrl.value + "/api/video/" + video.id + "?time=" + Math.random()
  await getMarks(video)
  await getMetadata(video)
  playerStore.trackCurrentTime()

  const index = _.findIndex(playerStore.playlist, (i) => i.id == video.id)
  playerStore.nowPlaying = index

  playerStore.player.playbackRate = playerStore.speed

  if (start_time) {
    playerStore.player.currentTime = start_time
  } else {
    start_time = 0
    if (SETTINGS.value.restorePlaybackTime == "1") {
      if (playerStore.metadata.time && playerStore.metadata.duration) {
        if (!(playerStore.metadata.duration - playerStore.metadata.time < 5)) {
          start_time = playerStore.metadata.time
        }
      }
      playerStore.player.currentTime = start_time
    }
  }

  // увеличиваем количество просмотров
  await itemsStore.countViewNumber(video, 'media')
  updateItemVideo(video.id)

  playerStore.playbackError = false // скрываем ошибки
  dialogsStore.markAdding.show = false // скрываем диалог добавления метки

  if (!reg.value && playerStore.nowPlaying > 14) {
    playerStore.player.src = ""
  }

  // Обновление заголовка
  if (isPlayerWindow.value) {
    document.title = video.basename
  }

  playerStore.changePlayerStatusText({
    text: `${playerStore.nowPlaying + 1}. ${video.name}`,
    icon: "format-list-bulleted",
  })

  isReady.value = true
}

const getMarks = async (video) => {
  try {
    const res = await axios.get(apiUrl.value + "/api/Mark/video/" + video.id)
    playerStore.marks = res.data

    // creating mark thumb
    if (playerStore.is_file_exists) {
      for (let mark of playerStore.marks) {
        const time = new Date(1000 * mark.time).toISOString().substr(11, 12)
        const imgPath = path.join(
          appStore.mediaPath || '',
          "videos/marks",
          `${mark.id}.jpg`
        )
        const res = await $operable.checkFileExists(imgPath, true)
        if (res) {
          eventBus.emit('updateMarkImage', mark.id)
          continue
        }

        try {
          await $operable.createThumb(time, video.path, imgPath, 180)
          eventBus.emit('updateMarkImage', mark.id)
        } catch (e) {
          console.log(e)
        }
      }

      if (marks.value && marks.value.getThumbs) {
        await marks.value.getThumbs()
      }
    }
  } catch (e) {
    console.log(e)
  }
}

const openPath = () => {
  $operable.openPath(video.value.path, false)
}

const stopSmoothScroll = (event) => {
  if (event.button != 1) return
  event.preventDefault()
  event.stopPropagation()
}

const toggleFullscreen = async () => {
  showControls()
  if (controls.value && controls.value.resize) {
    controls.value.resize()
  }

  if (playerStore.fullscreen) {
    try {
      screen.orientation.unlock()
      await document.exitFullscreen()
    } catch (e) {
      const is_macos = navigator.platform.indexOf('Mac') > -1
      if (window.os && is_macos && window.electronAPI) {
        window.electronAPI.send("setFullScreen", false)
      }
      console.log(e)
    }
  } else {
    document.getElementById("player").requestFullscreen()
    screen.orientation
      .lock("landscape")
      .then(() => {
        // alert("Locked")
      })
      .catch((error) => {
        // alert(error)
      })
  }
  playerStore.fullscreen = !playerStore.fullscreen
}

const togglePictureInPicture = async () => {
  showControls()
  if (playerStore.fullscreen) {
    await document.exitFullscreen()
    playerStore.fullscreen = false
  }

  if (document.pictureInPictureElement) {
    await document.exitPictureInPicture()
  } else if (document.pictureInPictureEnabled) {
    playerStore.player.requestPictureInPicture()
  }
}

const changeVolume = (e) => {
  let volume
  if (e.deltaY !== undefined) {
    volume = (playerStore.player.volume + e.deltaY / 1000 / 2).toFixed(2)
  } else if (e.volume !== undefined) {
    volume = e.volume
  } else {
    return
  }

  if (volume < 0) volume = 0
  if (volume > 1) volume = 1

  playerStore.player.volume = volume
  playerStore.volume = volume

  playerStore.changePlayerStatusText({
    text: (volume * 100).toFixed() + " %",
    icon: "volume-high",
  })
}

const handleKey = (e) => {
  if (playerStore.stop_listen_keyboard_events) return false

  let step = 10

  switch (true) {
    case e.code === "KeyZ" || (e.altKey && e.code === "ArrowLeft"):
      if (controls.value && controls.value.prev) {
        controls.value.prev()
      }
      break
    case e.code === "KeyC" || (e.altKey && e.code === "ArrowRight"):
      if (controls.value && controls.value.next) {
        controls.value.next()
      }
      break
    case e.code === "Space":
      togglePause()
      break
    case e.code === "ArrowRight":
      if (e.shiftKey) step = step * 3
      playerStore.playerJumpTo(playerStore.player.currentTime + step)
      break
    case e.code === "ArrowLeft":
      if (e.shiftKey) step = step * 3
      playerStore.playerJumpTo(playerStore.player.currentTime - step)
      break
    case e.code === "ArrowUp":
      changeVolume({deltaY: +100})
      break
    case e.code === "ArrowDown":
      changeVolume({deltaY: -100})
      break
    case e.code === "KeyF":
      toggleFullscreen()
      break
    case e.code === "KeyM":
      if (controls.value && controls.value.toggleMute) {
        controls.value.toggleMute()
      }
      break
    case e.code === "KeyP":
      if (controls.value && controls.value.togglePlaylist) {
        controls.value.togglePlaylist()
      }
      break
    case e.code === "KeyI":
      if (controls.value && controls.value.toggleMarks) {
        controls.value.toggleMarks()
      }
      break
    case e.code === "Comma":
      if (controls.value && controls.value.jumpToMark) {
        controls.value.jumpToMark('prev')
      }
      break
    case e.code === "Period":
      if (controls.value && controls.value.jumpToMark) {
        controls.value.jumpToMark('next')
      }
      break
    case e.code === "KeyX":
      if (controls.value && controls.value.stop) {
        controls.value.stop()
      }
      break
    case e.code === "Digit1":
      openAddingMark("favorite")
      break
    case e.code === "Digit2":
      openAddingMark("bookmark")
      break
    case e.code === "KeyE":
      if (controls.value && controls.value.editVideo) {
        controls.value.editVideo()
      }
      break
    case e.code === "Backspace" || e.code === "Delete":
      if (e.shiftKey && (e.ctrlKey || e.altKey)) {
        if (controls.value && controls.value.deleteVideo) {
          controls.value.deleteVideo(true)
        }
      } else if (e.ctrlKey || e.altKey) {
        if (controls.value && controls.value.deleteVideo) {
          controls.value.deleteVideo()
        }
      }
      break
  }
}

const clickOnVideo = (e) => {
  let btnCode = e.button
  switch (btnCode) {
    case 3:
      if (controls.value && controls.value.prev) {
        controls.value.prev()
      }
      break
    case 4:
      if (controls.value && controls.value.next) {
        controls.value.next()
      }
      break
  }
}

const playVideoObject = async (videos) => {
  const {n, o} = videos
  await updatePlaybackTime(o).then(() => {
    loadSrc(n)
  })
}

const togglePause = () => {
  if (controls.value && controls.value.togglePause) {
    controls.value.togglePause()
  }
}

const moveOverPlayer = _.debounce((e) => {
  if (!playerStore.active) return
  if (!e.movementX > 0 || !e.movementY > 0) return
  showControls()
  if (!playerStore.fullscreen || playerStore.mouseOverControls) return
  if (playerStore.paused) return

  timeoutControls.value = setTimeout(() => {
    playerStore.isControlsVisible = false
  }, 3000)
}, 5)

const showControls = () => {
  playerStore.isControlsVisible = true
  clearTimeout(timeoutControls.value)
}

const openAddingMark = (type) => {
  dialogsStore.markAdding.time = playerStore.currentTime
  dialogsStore.markAdding.type = type || 'favorite'
  dialogsStore.markAdding.show = true
}

const addMark = async (data) => {
  let mark = {
    type: dialogsStore.markAdding.type,
    time: dialogsStore.markAdding.time,
    end: dialogsStore.markAdding.end,
    mediaId: video.value.id,
  }

  mark = {...mark, ...data}

  const addTag = async () => {
    try {
      await axios({
        method: "post",
        url: apiUrl.value + "/api/tagsInMedia/createOne",
        data: {
          mediaId: video.value.id,
          tagId: data.tagId,
          metaId: dialogsStore.markAdding.meta?.id,
        },
      }).then((res) => {
        if (res.data[1]) {
          $operable.setNotification({
            title: t('player.tag_added_to_video'),
            type: 'success',
            icon: 'tag',
          })
        }
      })
      updateItemVideo(video.value.id)
    } catch (e) {
      console.log(e)
    }
  }

  try {
    await axios({
      method: "post",
      url: apiUrl.value + "/api/mark",
      data: mark,
    })

    playerStore.changePlayerStatusText({
      text: t('player.mark_added'),
      icon: "tooltip-plus",
    })

    if (data.tagId) {
      await addTag()
    }

    await getMarks(video.value)
  } catch (e) {
    console.log(e)
  }
}

const removeMark = async (mark) => {
  const imgPath = path.join(
    appStore.mediaPath || '',
    "videos/marks",
    `${mark.id}.jpg`
  )

  try {
    await axios.delete(apiUrl.value + "/api/mark/" + mark.id)
    await $operable.deleteLocalFile(imgPath)
    await getMarks(video.value)
  } catch (e) {
    console.log(e)
  }
}

const getMetadata = (video) => {
  return new Promise((resolve, reject) => {
    axios
      .get(apiUrl.value + "/api/videoMetadata/" + video.id)
      .then((res) => {
        playerStore.metadata = res.data
        playerStore.media = video
        resolve()
      })
      .catch((e) => {
        reject(e)
      })
  })
}

const updatePlaybackTime = (video) => {
  return new Promise((resolve, reject) => {
    axios({
      method: "put",
      url: apiUrl.value + "/api/videoMetadata/" + video.id,
      data: {
        time: playerStore.currentTime,
      },
    })
      .then(() => {
        updateItemVideo(video.id)
        resolve()
      })
      .catch((e) => {
        reject(e)
      })
  })
}

const nextVideo = () => {
  if (controls.value && controls.value.next) {
    controls.value.next()
  }
}

const updateItemVideo = (id) => {
  const data = {
    ids: [id],
    type: 'media',
  }

  if (isPlayerWindow.value) {
    window.electronAPI.send("getItemsFromDb", data)
  } else {
    eventBus.emit("getItemsFromDb", data)
  }
}

const initPlayingVideo = (video, videos, time) => {
  console.log('initPlayingVideo called:', {
    videoId: video?.id,
    videosCount: videos?.length,
    time: time
  });

  if (!video || !videos) {
    console.error('Invalid video data received');
    $operable.setNotification({
      type: 'error',
      title: t('player.invalid_video_data'),
      text: t('player.could_not_play_video')
    });
    return;
  }

  // Нормализуем плейлист
  playerStore.playlist = videos.map((i) => {
    // Создаем корректные URL для превью
    const thumbUrl = i.thumb
      ? (i.thumb.startsWith('http') ? i.thumb : `${appStore.localhost}${i.thumb}`)
      : '/images/unavailable.png';

    return {
      ...i,
      thumb: thumbUrl
    };
  });

  // Загружаем и воспроизводим видео
  loadSrc(video, time);
  playerStore.active = true;

  // Добавляем обработчик клавиш
  window.addEventListener("keydown", handleKey);

  // Загружаем метаданные
  const url = `/api/MetaInMediaType?mediaTypeId=${getDefaultMediaTypeId(appStore.mediaTypes)}`
  axios
    .get(apiUrl.value + url)
    .then((res) => {
      itemsStore.assigned = res.data
    })
    .catch((e) => {
      console.log('Error loading metadata:', e)
    })
}

const exitHandler = () => {
  if (!document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
    playerStore.fullscreen = false
  }
}

// Lifecycle
// В Player.vue добавьте в onMounted:
onMounted(async () => {
  await nextTick()

  console.log('Player mounted, mode:', isPlayerWindow.value ? 'player window' : 'embedded')
  console.log('window.electronAPI:', window.electronAPI ? 'Exists' : 'Missing')
  console.log('window.$operable:', window.$operable ? 'Exists' : 'Missing')

  if (videoPlayer.value) {
    playerStore.player = videoPlayer.value
    initPlayer()
  }

  // Listen for play video events from eventBus (embedded mode)
  eventBus.on('playVideo', (event) => {
    console.log('Player: Received playVideo from eventBus:', event?.video?.id);
    if (event && event.video) {
      const {video, videos, time} = event
      initPlayingVideo(video, videos, time)
    } else {
      console.error('Invalid event data from eventBus:', event);
    }
  })

  if (window.electronAPI) {
    // Устанавливаем обработчик для play-video
    window.electronAPI.on("play-video", (event, data) => {
      console.log('Player: Received play-video from electronAPI:', data);
      if (data && data.video) {
        initPlayingVideo(data.video, data.videos, data.time)
      } else {
        console.error('Invalid data received from electronAPI:', data);
        $operable.setNotification({
          type: 'error',
          title: t('player.error_title'),
          text: t('player.invalid_video_data')
        });
      }
    })

    window.electronAPI.on('stop-playing-video', () => {
      console.log('Player: Received stop-playing-video');
      closePlayer()
    })
  }

  if (document.addEventListener) {
    document.addEventListener('fullscreenchange', exitHandler, false)
    document.addEventListener('mozfullscreenchange', exitHandler, false)
    document.addEventListener('MSFullscreenChange', exitHandler, false)
    document.addEventListener('webkitfullscreenchange', exitHandler, false)
  }
})

onBeforeUnmount(() => {
  eventBus.off('playVideo', initPlayingVideo)
  document.removeEventListener('fullscreenchange', exitHandler)
  document.removeEventListener('mozfullscreenchange', exitHandler)
  document.removeEventListener('MSFullscreenChange', exitHandler)
  document.removeEventListener('webkitfullscreenchange', exitHandler)
})

// Watchers
watch(() => playerStore.volume, (newValue, oldValue) => {
  if (newValue !== oldValue && playerStore.player) {
    playerStore.player.volume = newValue
  }
})
</script>

<style lang="scss">
.dialog-player {
  border-radius: 15px;
}

.player-separate-window {
  width: 100% !important;
  max-height: 100% !important;
  height: 100%;
  max-width: 100% !important;
  overflow-y: visible;
  margin: 0 !important;

  .player {
    border-radius: 0 !important;
  }

  .player .video-wrapper {
    max-height: 100%;
  }

  .status-text {
    top: 28px;
  }
}

.not-macos {
  .player-separate-window {
    .status-text {
      left: 0;
    }
  }
}
</style>