<template>
  <component
    :is="isPlayerWindow ? 'div' : VDialog"
    v-bind="playerWrapperProps"
  >
    <div
      @mousedown="stopSmoothScroll($event)"
      @mousemove="moveOverPlayer"
      :class="{
        fullscreen: player.fullscreen,
        'no-cursor': !player.isControlsVisible,
        'player--window': isPlayerWindow,
      }"
      class="player"
      ref="player"
      id="player"
    >
      <SystemBarPlayer
        v-if="isPlayerWindow"
        v-show="!player.fullscreen"
      ></SystemBarPlayer>

      <div
        class="player-body"
        :class="{
          'player-body--marks': player.marksVisible,
          'player-body--playlist': player.playlistVisible,
        }"
      >
        <Marks
          @removeMark="removeMark"
          ref="marks"
        />

        <div class="player-main">
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
            :class="{
              'playback-error': showPlaybackError,
              'audio-mode': isAudioMode,
            }"
            class="video-wrapper"
          >
            <video
              ref="videoPlayer"
              :class="{ 'audio-hidden': isAudioMode }"
              autoplay
            />

            <div v-if="isAudioMode && !showPlaybackError"
              class="audio-overlay">
              <v-img
                :src="audioThumb"
                class="audio-cover"
                cover
              />
              <div class="audio-info">
                <v-icon class="audio-icon" size="48">mdi-music-circle</v-icon>
                <div class="audio-title" :title="currentPlaying">{{ currentPlaying }}</div>
              </div>
            </div>

          <div v-if="showPlaybackError"
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
              <div v-if="player.is_file_exists">
                {{ formatErrorMessage }}
                <div v-if="fileExtension" class="error-detail">
                  {{ t('player.error_extension', { ext: fileExtension }) }}
                </div>
                <div v-if="player.metadata.codec" class="error-detail">
                  {{ t('player.error_codec', { codec: player.metadata.codec }) }}
                </div>
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
              class="mt-4 ml-2"
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
      </div>
      <DialogMarkAdding
        v-if="dialogsStore.markAdding.show"
        @togglePause="togglePause"
        @addMark="addMark($event)"
      />
    </div>
  </component>
</template>

<script setup>
import {ref, computed, onMounted, onBeforeUnmount, watch, nextTick} from 'vue'
import {VDialog} from 'vuetify/components/VDialog'
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
import {getDefaultMediaTypeId, findMediaTypeById, isAudioMediaType, isAudioFilePath} from '@/utils/mediaType'
import {buildMarkPayload} from '@/utils/markAdding'
import {isWinElectronUi} from '@/utils/debugWinElectronUi'
import {isStandalonePlayerRoute, consumePendingPlay, subscribePlayerWindowMessages} from '@/utils/playerWindow'

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
const isPlayerWindow = computed(() =>
  isStandalonePlayerRoute(route, settingsStore.open_player_in_separate_window)
)
const isActive = computed(() => isPlayerWindow.value || playerStore.active)
const playerDialogClass = computed(() => {
  if (!isPlayerWindow.value) return 'dialog-player'
  return isWinElectronUi()
    ? 'player-standalone--win'
    : ''
})

const playerWrapperProps = computed(() => {
  if (isPlayerWindow.value) {
    return {
      class: ['player-standalone', playerDialogClass.value].filter(Boolean),
    }
  }

  return {
    'onUpdate:modelValue': closePlayer,
    modelValue: isActive.value,
    persistent: false,
    contentClass: playerDialogClass.value,
    width: 2000,
    noClickAnimation: true,
    eager: true,
  }
})
const SETTINGS = computed(() => settingsStore)
const reg = computed(() => registrationStore)
const video = computed(() => playerStore.playlist[playerStore.nowPlaying])
const currentPlaying = computed(() => video.value ? video.value.name : "")
const isAudioMode = computed(() => playerStore.isAudioMode)
const audioThumb = computed(() => video.value?.thumb || '/images/unavailable.png')
const fileExtension = computed(() => {
  if (!video.value?.path) return ''
  const ext = path.extname(video.value.path)
  return ext ? ext.slice(1).toUpperCase() : ''
})
const formatErrorMessage = computed(() => {
  return isAudioMode.value
    ? t('player.audio_format_not_supported')
    : t('player.video_format_not_supported')
})
const showPlaybackError = computed(() => isReady.value && playerStore.playbackError && reg.value)
const apiUrl = computed(() => appStore.localhost)
const os = computed(() => window.os ? window.os.type() : false)

// Methods
const buildPlayerWindowTitle = (video) => {
  const base = appStore.app_title || 'MediaChips'
  const fileName = video?.basename || video?.name
  return fileName ? `${base} - ${fileName}` : base
}

const updatePlayerWindowTitle = (video) => {
  if (!isPlayerWindow.value) return
  const title = buildPlayerWindowTitle(video)
  playerStore.mediaWindowTitle = title
  document.title = title
}

const closePlayer = async () => {
  if (video.value) {
    await updatePlaybackTime(video.value)
  }

  if (playerStore.player) {
    playerStore.player.pause()
    playerStore.player.src = null
  }

  clearInterval(playerStore.currentTimeTimeout)
  playerStore.currentTime = 0
  playerStore.active = false
  playerStore.isAudioMode = false
  playerStore.paused = false
  window.removeEventListener("keydown", handleKey)

  if (isPlayerWindow.value) {
    playerStore.mediaWindowTitle = ''
    document.title = appStore.app_title || 'MediaChips'
  }
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

const resolvePlayableVideo = async (initialVideo) => {
  const playlist = playerStore.playlist
  const candidates = []

  if (playlist.length > 0) {
    const foundIndex = _.findIndex(playlist, (i) => i.id == initialVideo.id)

    if (foundIndex >= 0) {
      for (let offset = 0; offset < playlist.length; offset++) {
        const index = (foundIndex + offset) % playlist.length
        candidates.push({video: playlist[index], index})
      }
    } else if (initialVideo?.path || initialVideo?.id) {
      candidates.push({video: initialVideo, index: 0})
    }
  } else if (initialVideo?.path) {
    candidates.push({video: initialVideo, index: 0})
  }

  for (const {video: candidate, index} of candidates) {
    if (!candidate?.path) continue

    if (await $operable.checkFileExists(candidate.path)) {
      return {video: candidate, index}
    }
  }

  if (initialVideo?.id) {
    const index = playlist.length > 0
      ? Math.max(0, _.findIndex(playlist, (i) => i.id == initialVideo.id))
      : 0
    return {video: initialVideo, index}
  }

  return null
}

const loadSrc = async (video, start_time) => {
  const resolved = await resolvePlayableVideo(video)

  if (!resolved) {
    console.error('Player: No playable video found in playlist:', video?.path)
    playerStore.is_file_exists = false
    playerStore.playbackError = true
    isReady.value = true
    return
  }

  video = resolved.video
  const mediaType = findMediaTypeById(appStore.mediaTypes, video.mediaTypeId)
  playerStore.isAudioMode = isAudioMediaType(mediaType) || isAudioFilePath(video.path)
  playerStore.is_file_exists = await $operable.checkFileExists(video.path)

  if (playerStore.playlist.length > 0) {
    playerStore.nowPlaying = resolved.index
  }

  // подргужаем соурс и получаем данные о видео
  playerStore.player.src = apiUrl.value + "/api/video/" + video.id + "?time=" + Math.random()
  await getMarks(video)
  await getMetadata(video)
  playerStore.trackCurrentTime()

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
  dialogsStore.closeMarkAdding()

  if (!reg.value && playerStore.nowPlaying > 14) {
    playerStore.player.src = ""
  }

  if (isPlayerWindow.value) {
    updatePlayerWindowTitle(video)
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
    if (!playerStore.isAudioMode && screen.orientation?.lock) {
      screen.orientation
        .lock("landscape")
        .catch(() => {})
    }
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
  if (!e.movementX && !e.movementY) return
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
  dialogsStore.openMarkAdding({
    time: playerStore.currentTime,
    type: type || 'favorite',
  })
}

const addTagToMedia = async (tagId, metaId) => {
  const response = await axios.post(apiUrl.value + '/api/TagsInMedia/createOne', {
    mediaId: video.value.id,
    tagId,
    metaId: metaId || appStore.getTagById(tagId)?.metaId,
  })

  if (response.data?.[1]) {
    $operable.setNotification({
      title: t('player.tag_added_to_video'),
      type: 'success',
      icon: 'tag',
    })
  }

  updateItemVideo(video.value.id)
}

const addMark = async (data = {}) => {
  if (!video.value?.id) return

  const adding = dialogsStore.markAdding
  dialogsStore.setMarkAddingSubmitting(true)

  const mark = buildMarkPayload({
    adding,
    data,
    mediaId: video.value.id,
  })

  try {
    await axios.post(apiUrl.value + '/api/mark', mark)

    if (mark.tagId) {
      await addTagToMedia(mark.tagId, adding.meta?.id)
    }

    playerStore.changePlayerStatusText({
      text: t('player.mark_added'),
      icon: 'tooltip-plus',
    })

    await getMarks(video.value)
    dialogsStore.closeMarkAdding()
  } catch (e) {
    console.error(e)
    $operable.setNotification({
      type: 'error',
      title: t('player.mark_dialog.add_failed'),
      text: e?.response?.data?.message || e?.message,
    })
  } finally {
    dialogsStore.setMarkAddingSubmitting(false)
  }
}

const removeMark = async (mark) => {
  try {
    await axios.delete(apiUrl.value + "/api/mark/" + mark.id)
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
  if (!video || !videos) {
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
  updatePlayerWindowTitle(video)
  loadSrc(video, time);
  playerStore.active = true;

  // Добавляем обработчик клавиш
  window.addEventListener("keydown", handleKey);

  // Загружаем метаданные
  const mediaTypeId = video.mediaTypeId || getDefaultMediaTypeId(appStore.mediaTypes)
  const url = `/api/MetaInMediaType?mediaTypeId=${mediaTypeId}`
  axios
    .get(apiUrl.value + url)
    .then((res) => {
      itemsStore.assigned = res.data
    })
    .catch((e) => {
      console.log('Error loading metadata:', e)
    })
}

const handlePlayVideoEvent = (event) => {
  if (event && event.video) {
    const {video, videos, time} = event
    initPlayingVideo(video, videos, time)
  }
}

const exitHandler = () => {
  if (!document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
    playerStore.fullscreen = false
  }
}

let unsubscribePlayerWindow = null

onMounted(async () => {
  await nextTick()

  if (videoPlayer.value) {
    playerStore.player = videoPlayer.value
    initPlayer()
  }

  eventBus.on('playVideo', handlePlayVideoEvent)

  if (window.electronAPI) {
    window.electronAPI.on("play-video", (event, data) => {
      if (data && data.video) {
        initPlayingVideo(data.video, data.videos, data.time)
      } else {
        $operable.setNotification({
          type: 'error',
          title: t('player.error_title'),
          text: t('player.invalid_video_data')
        });
      }
    })

    window.electronAPI.on('stop-playing-video', () => {
      closePlayer()
    })
  } else if (isPlayerWindow.value) {
    const pending = consumePendingPlay()
    if (pending?.video) {
      initPlayingVideo(pending.video, pending.videos, pending.time)
    }

    unsubscribePlayerWindow = subscribePlayerWindowMessages((message) => {
      if (message?.type === 'play-video' && message.data?.video) {
        initPlayingVideo(message.data.video, message.data.videos, message.data.time)
      }
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
  eventBus.off('playVideo', handlePlayVideoEvent)
  unsubscribePlayerWindow?.()
  clearTimeout(timeoutControls.value)
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

  .player {
    min-height: 50vh;
  }
}

.player-standalone {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;

  .player {
    height: 100%;
    border-radius: 0;
  }

  .player .video-wrapper {
    max-height: 100%;
    min-height: 0;
  }
}

.player-standalone--win {
  --player-window-radius: 8px;
  overflow: hidden;
  border-radius: var(--player-window-radius);

  &:has(.player.fullscreen),
  &:has(.system-bar-player.maximized) {
    --player-window-radius: 0px;
    border-radius: 0;
  }
}

.not-macos {
  .player-standalone {
    .status-text {
      left: 0;
    }
  }
}
</style>