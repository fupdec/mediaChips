<template>
  <v-card
    @mouseenter="player.mouseOverControls = true"
    @mouseleave="player.mouseOverControls = false"
    :class="{hidden:!player.isControlsVisible}"
    class="controls px-6"
    theme="dark"
  >
    <v-card-actions
      @wheel="wheelSeek"
      @mousemove="saveEvent($event); showPreview($event)"
      @mouseleave="player.progress_hover = null; preview_show = false"
      class="timeline pa-0"
      ref="slider_progress"
    >
      <v-slider
        :model-value="player.seeking ? player.seekTime : player.currentTime"
        @update:model-value="handleSliderChange"
        @start="startSeeking"
        @end="seek"
        @mousedown="handleMouseSeek($event)"
        :disabled="!player.is_file_exists || player.playbackError"
        :track-size="2"
        class="timeline-slider pt-4"
        color="white"
        step="0.05"
        min="0"
        :max="player.duration"
        hide-details
      ></v-slider>

      <controls-set-mark-time v-if="dialogsStore.markAdding.show"/>

      <Preview></Preview>

      <Mark
        v-for="mark in player.marks"
        @removeMark="removeMark"
        :key="mark.id"
        :mark="mark"
        :controls_width="controls_width"
      />
    </v-card-actions>

    <v-card-actions class="buttons pb-4 px-0 pt-0">
      <v-btn @click="togglePause"
        icon
        variant="tonal"
        :density="density"
        dark>
        <v-icon v-if="player.paused"
          large>mdi-play
        </v-icon>
        <v-icon v-else
          large>mdi-pause
        </v-icon>
        <div class="tip"
          style="left: 0">
          <span class="mr-2"
            v-html="player.paused ? t('player.controls.play') : t('player.controls.pause')"/>
          <v-hotkey keys="Space"/>
        </div>
      </v-btn>

      <!-- NAVIGATION -->
      <v-btn-group variant="tonal"
        :density="density"
        style="overflow: visible"
        rounded="xl"
        dark
        class="px-0 ml-3">
        <v-btn @click="prev"
          :disabled="isPrevDisabled"
          icon
          dark>
          <v-icon>mdi-skip-previous</v-icon>
          <div class="tip">
            <span class="mr-2"
              v-html="t('player.controls.previous')"/>
            <v-hotkey keys="z"/>
            {{ t('common.or') }}
            <v-hotkey keys="alt+left"/>
          </div>
        </v-btn>

        <v-btn @click="stop"
          icon
          dark>
          <v-icon>mdi-stop</v-icon>
          <div class="tip">
            <span class="mr-2"
              v-html="t('player.controls.stop')"/>
            <v-hotkey keys="x"/>
          </div>
        </v-btn>

        <v-btn @click="next"
          :disabled="isNextDisabled"
          icon
          dark>
          <v-icon>mdi-skip-next</v-icon>
          <div class="tip">
            <span class="mr-2"
              v-html="t('player.controls.next')"/>
            <v-hotkey keys="c"/>
            {{ t('common.or') }}
            <v-hotkey keys="alt+right"/>
          </div>
        </v-btn>
      </v-btn-group>

      <!-- TIME -->
      <v-btn
        @click="player.timeRemain = !player.timeRemain"
        class="time px-2 mx-1 body-2"
        variant="tonal"
        :density="density"
        rounded
        small
        dark
      >
        <div v-if="!player.timeRemain">{{ msToTime(player.currentTime) }}</div>
        <div v-else>- {{ msToTime(player.duration - player.currentTime) }}</div>
        <span class="mx-1">/</span>
        <div>{{ msToTime(player.duration) }}</div>
        <div
          v-html="t('player.controls.switch_time')"
          class="tip body-2"
          style="left: 0"
        />
      </v-btn>

      <div class="speed">
        <v-menu
          attach=".speed"
          nudge-top="45"
          nudge-left="10"
          min-width="120"
          top
        >
          <template v-slot:activator="{ props: menuProps }">
            <v-btn v-bind="menuProps"
              icon
              variant="tonal"
              :density="density"
              dark>
              <v-icon>mdi-play-speed</v-icon>
              <div class="tip"
                v-html="t('player.playback_speed_label')"/>
            </v-btn>
          </template>

          <v-list density="compact"
            class="py-1">
            <v-list-item-group
              :model-value="player.speed"
              @update:model-value="changeSpeed"
              color="primary"
            >
              <v-list-item v-for="i in speeds"
                :key="i"
                :value="i">
                <v-list-item-title v-text="i == 1 ? t('common.normal') : i"/>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-menu>
      </div>

      <v-spacer></v-spacer>

      <!-- MARKS -->
      <v-btn-group variant="tonal"
        :density="density"
        rounded="xl"
        style="overflow: visible"
        dark
        class="mark-buttons px-0">
        <v-btn @click="toggleMarks"
          icon
          dark>
          <v-icon size="20"
            v-if="player.marksVisible">mdi-tooltip
          </v-icon>
          <v-icon size="20"
            v-else>mdi-tooltip-outline
          </v-icon>
          <div class="tip">
            <span class="mr-2">{{ t('player.marks_list') }}</span>
            <v-hotkey keys="m"/>
          </div>
        </v-btn>

        <v-btn @click="addMark"
          icon
          dark>
          <v-icon v-if="dialogsStore.markAdding.show">mdi-plus-circle</v-icon>
          <v-icon v-else>mdi-plus</v-icon>
          <div class="tip">
            <span class="mr-2"
              v-html="t('player.controls.add_mark')"/>
            <v-hotkey keys="1"/>
            ,
            <v-hotkey keys="2"/>
          </div>
        </v-btn>

        <v-btn
          @click="jumpToMark('prev')"
          :disabled="player.marks.length == 0"
          class="mark-prev"
          icon
          dark
        >
          <v-icon>mdi-chevron-left</v-icon>
          <div class="tip">
            <span class="mr-2">{{ t('player.previous_mark') }}</span>
            <v-hotkey keys="<"/>
          </div>
        </v-btn>

        <v-btn
          @click="jumpToMark('next')"
          :disabled="player.marks.length == 0"
          class="mark-next"
          icon
          dark
        >
          <v-icon>mdi-chevron-right</v-icon>
          <div class="tip">
            <span class="mr-2">{{ t('player.next_mark') }}</span>
            <v-hotkey keys=">"/>
          </div>
        </v-btn>
      </v-btn-group>

      <!-- PLAYLIST -->
      <v-btn @click="togglePlaylist"
        variant="tonal"
        :density="density"
        class="playlist-buttons mx-1"
        icon
        dark>
        <v-icon v-if="playerStore.playlistVisible">mdi-view-list</v-icon>
        <v-icon v-else>mdi-format-list-bulleted</v-icon>
        <div class="tip">
          <span class="mr-2">{{ t('player.playlist') }}</span>
          <v-hotkey keys="p"/>
        </div>
      </v-btn>

      <!-- EDITING -->
      <v-btn-group v-if="video"
        variant="tonal"
        :density="density"
        rounded="xl"
        style="overflow: visible"
        dark
        class="btn-edit-video px-0">
        <v-btn @click="setAsThumb"
          class="action-buttons"
          icon
          dark>
          <v-icon>mdi-image-outline</v-icon>
          <div class="tip"
            v-html="t('player.controls.set_frame_as_thumb')"/>
        </v-btn>

        <v-btn @click="editVideo"
          icon
          dark>
          <v-icon>mdi-square-edit-outline</v-icon>
          <div class="tip">
            <span class="mr-2">{{ t('player.edit_video') }}</span>
            <v-hotkey keys="e"/>
          </div>
        </v-btn>

        <v-dialog
          v-if="dialog_video_edit && video_editing"
          v-model="dialog_video_edit"
          :attach="player.fullscreen ? '.player' : false"
          :fullscreen="xs"
          :width="xl ? 1800 : 1200"
          persistent
          no-click-animation
          scrollable
          hide-overlay
        >
          <v-card>
            <DialogHeader
              @close="dialog_video_edit = false"
              :header="t('player.editing')"
              :subheader="video_editing.name"
              :buttons="[
                  {
                    icon: 'content-save',
                    text: t('common.save'),
                    color: 'success',
                    outlined: false,
                    action: updateVideoInfo,
                  },
                ]"
              icon="pencil"
              closable
            />

            <v-card-text :key="video_editing.id"
              class="pt-4 px-0">
              <EditPinnedMetaValues
                v-if="video_editing"
                @close="dialogsStore.mediaEditing.show = false"
                :media="video_editing"
                ref="editingComponent"
              ></EditPinnedMetaValues>
            </v-card-text>
          </v-card>
        </v-dialog>

        <v-menu
          attach=".btn-edit-video"
          location="top"
          :offset="8"
          width="180"
        >
          <template v-slot:activator="{ props: menuProps }">
            <v-btn v-bind="menuProps"
              style="border-top-right-radius: 24px; border-bottom-right-radius: 24px;"
              icon
              dark
            >
              <v-icon>mdi-delete-outline</v-icon>
              <div class="tip">
                <span class="mr-2"
                  v-html="t('player.controls.delete_video')"/>
                <v-hotkey keys="alt+del"/>
              </div>
            </v-btn>
          </template>

          <v-list density="compact"
            class="py-1">
            <v-list-item @click="deleteVideo(true)">
              <v-list-item-title>
                <v-icon class="mr-4"
                  icon="mdi-delete-alert"
                  color="error"/>
                <span>{{ t('actions.delete_with_file') }}</span>
              </v-list-item-title>
            </v-list-item>

            <v-list-item @click="deleteVideo()">
              <v-list-item-title>
                <v-icon class="mr-4"
                  icon="mdi-delete"
                  color="error"/>
                <span>{{ t('common.delete') }}</span>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-btn-group>

      <v-spacer></v-spacer>

      <!-- SCREEN -->
      <v-btn-group variant="tonal"
        :density="density"
        rounded="xl"
        style="overflow: visible"
        dark
        class="px-0 mr-2">
        <v-btn @click="$emit('toggleFullscreen')"
          icon
          dark>
          <v-icon v-if="player.fullscreen">mdi-fullscreen-exit</v-icon>
          <v-icon v-else>mdi-fullscreen</v-icon>
          <div class="tip">
            <span
              class="mr-2"
              v-html="player.fullscreen ? t('player.controls.exit_fullscreen') : t('player.controls.fullscreen')"
            />
            <v-hotkey keys="f"/>
          </div>
        </v-btn>

        <v-btn
          @click="$emit('togglePictureInPicture')"
          class="toggle-picture-in-picture"
          icon
          dark
        >
          <v-icon size="20">mdi-picture-in-picture-bottom-right</v-icon>
          <div class="tip"
            v-html="t('player.controls.picture_in_picture')"/>
        </v-btn>
      </v-btn-group>

      <!-- VOLUME -->
      <v-btn-group @wheel="changeVolume"
        variant="tonal"
        :density="density"
        rounded="xl"
        style="overflow: visible"
        dark
        class="volume px-0">
        <v-btn @click="toggleMute"
          icon
          dark>
          <v-icon>mdi-{{ volumeIcon }}</v-icon>
          <div class="tip">
            <span class="mr-2"
              v-html="t('player.controls.mute')"/>
            <v-hotkey keys="m"/>
          </div>
        </v-btn>
        <v-slider
          v-model="playerStore.volume"
          class="volume-slider ma-0 pl-2 pr-6"
          color="white"
          width="100"
          min="0"
          step="0.05"
          max="1"
          track-size="1"
          hide-details
        />
      </v-btn-group>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import {ref, computed, onMounted, onBeforeUnmount, watch, nextTick} from 'vue'
import {useI18n} from 'vue-i18n'
import {useAppStore} from '@/stores/app'
import {usePlayerStore} from '@/stores/player'
import {useDialogsStore} from '@/stores/dialogs'
import {useEventBus} from '@/utils/eventBus'
import {useDisplay} from 'vuetify'
import axios from 'axios'
import _ from 'lodash'
import path from "path-browserify"
import DialogHeader from '@/components/elements/DialogHeader.vue'
import EditPinnedMetaValues from "@/components/items/EditPinnedMetaValues.vue";
import Preview from "@/components/app/player/Preview.vue";
import Mark from '@/components/app/player/Mark.vue'
import ControlsSetMarkTime
  from "@/components/app/player/ControlsSetMarkTime.vue";

const props = defineProps({
  routeQuery: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits([
  'toggleFullscreen',
  'togglePictureInPicture',
  'play',
  'changeVolume',
  'showControls',
  'addMark',
  'removeMark',
  'close',
  'updateVideo'
])

// Stores
const appStore = useAppStore()
const playerStore = usePlayerStore()
const dialogsStore = useDialogsStore()
const eventBus = useEventBus()
const {xs, xl, mdAndDown, smAndDown} = useDisplay()
const {t} = useI18n()

// Refs
const slider_progress = ref(null)
const editingComponent = ref(null)
const speeds = ref([0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2])
const is_mounted = ref(false)
const resized = ref(0)
const video_editing = ref(null)
const dialog_video_edit = ref(false)
const preview_event_target = ref(null)
const preview_show = ref(true)

// Computed
const player = computed(() => playerStore)
const apiUrl = computed(() => appStore.localhost)
const is_separate_window = computed(() => props.routeQuery.player !== undefined)
const video = computed(() => player.value.playlist[player.value.nowPlaying])

const density = computed(() => {
  let density = 'default'
  if (mdAndDown.value) {
    density = 'comfortable'
  }
  if (smAndDown.value) {
    density = 'compact'
  }
  return density
})


const isPrevDisabled = computed(() => {
  if (player.value.playlistMode.includes("shuffle")) {
    let shuffleIndex = player.value.playlistShuffle.indexOf(player.value.nowPlaying)
    return shuffleIndex == 0 && !player.value.playlistMode.includes("loop")
  } else {
    return player.value.nowPlaying == 0 && !player.value.playlistMode.includes("loop")
  }
})

const isNextDisabled = computed(() => {
  if (player.value.playlistMode.includes("shuffle")) {
    let shuffleIndex = player.value.playlistShuffle.indexOf(player.value.nowPlaying)
    return (
      shuffleIndex + 1 >= player.value.playlist.length &&
      !player.value.playlistMode.includes("loop")
    )
  } else {
    return (
      player.value.nowPlaying + 1 >= player.value.playlist.length &&
      !player.value.playlistMode.includes("loop")
    )
  }
})

const prevVideo = computed(() => player.value.playlist[player.value.nowPlaying - 1])
const nextVideo = computed(() => player.value.playlist[player.value.nowPlaying + 1])

const volumeIcon = computed(() => {
  if (player.value.muted) return "volume-mute"
  if (player.value.volume > 0.7) return "volume-high"
  if (player.value.volume > 0.3) return "volume-medium"
  return "volume-low"
})

const controls_width = computed(() => {
  if (is_mounted.value && resized.value > -1 && slider_progress.value) {
    return slider_progress.value?.$el?.clientWidth || 0
  } else return 0
})

// Methods
const msToTime = (time) => {
  return $readable.getReadableDuration(time)
}

const play = () => {
  emit('showControls')
  playerStore.playerPlay()
}

const pause = () => {
  emit('showControls')
  playerStore.playerPause()
}

const stop = () => {
  emit('showControls')
  playerStore.playerStop()
}

const togglePause = () => {
  emit('showControls')
  player.value.paused ? play() : pause()
}

const prev = async () => {
  if (isPrevDisabled.value) return
  playerStore.paused = false
  let isLoopMode = player.value.playlistMode.includes("loop")
  let current = video.value

  if (player.value.playlistMode.includes("shuffle")) {
    let shuffleIndex = player.value.playlistShuffle.indexOf(player.value.nowPlaying)
    shuffleIndex = shuffleIndex - 1
    if (isLoopMode && shuffleIndex < 0) {
      shuffleIndex = player.value.playlist.length - 1
    }
    playerStore.nowPlaying = player.value.playlistShuffle[shuffleIndex]
  } else {
    playerStore.nowPlaying = player.value.nowPlaying - 1
    if (isLoopMode && player.value.nowPlaying < 0) {
      playerStore.nowPlaying = player.value.playlist.length - 1
    }
  }

  emit("play", {n: video.value, o: current})
  if (player.value.playlistVisible) {
    eventBus.emit('scrollToNowPlaying')
  }
}

const next = async () => {
  if (isNextDisabled.value) return
  playerStore.paused = false
  let isLoopMode = player.value.playlistMode.includes("loop")
  let current = video.value

  if (player.value.playlistMode.includes("shuffle")) {
    let shuffleIndex = player.value.playlistShuffle.indexOf(player.value.nowPlaying)
    shuffleIndex = shuffleIndex + 1
    if (isLoopMode && shuffleIndex == player.value.playlist.length) {
      shuffleIndex = 0
    }
    playerStore.nowPlaying = player.value.playlistShuffle[shuffleIndex]
  } else {
    playerStore.nowPlaying = player.value.nowPlaying + 1
    if (isLoopMode && player.value.nowPlaying > player.value.playlist.length - 1) {
      playerStore.nowPlaying = 0
    }
  }

  emit("play", {n: video.value, o: current})
  if (player.value.playlistVisible) {
    eventBus.emit('scrollToNowPlaying')
  }
}

const startSeeking = (time) => {
  playerStore.seeking = true
  playerStore.seekTime = time
}

const seek = (time) => {
  playerStore.seeking = false
  jumpTo(time)
}

const handleSliderChange = (value) => {
  if (player.value.seeking) {
    playerStore.seekTime = value
  }
}

const wheelSeek = (e) => {
  if (e.altKey) {
    e.deltaY > 0 ? jumpToMark("prev") : jumpToMark("next")
    return
  }
  let s = e.deltaY / -20
  if (e.shiftKey) s = s * 4
  else if (e.ctrlKey) s = s / 2
  jumpToSeconds(s)
}

const jumpTo = (time) => {
  playerStore.playerJumpTo(time)
}

const jumpToSeconds = (time) => {
  jumpTo(player.value.currentTime + time)
}

const jumpToMark = (type) => {
  let marks = []
  let currentTime = 0

  if (type == "prev") {
    marks = _.orderBy(player.value.marks, "time", ["desc"])
    currentTime = player.value.currentTime - 5
  } else if (type == "next") {
    marks = player.value.marks
    currentTime = player.value.currentTime
  }

  for (let mark of marks) {
    if (
      (type == "prev" && mark.time < currentTime) ||
      (type == "next" && mark.time > currentTime)
    ) {
      jumpTo(mark.time)
      let text = ""
      if (mark.type == "meta") text = mark["tag.name"]
      else text = mark.name

      playerStore.changePlayerStatusText({
        text: text,
        icon: "tooltip",
      })
      break
    }
  }
}

const handleMouseSeek = (e) => {
  let btnCode = e.button
  switch (btnCode) {
    case 3:
      jumpToMark("prev")
      break
    case 4:
      jumpToMark("next")
      break
  }
}

const togglePlaylist = () => {
  player.value.playlistVisible = !player.value.playlistVisible
  if (!player.value.playlistVisible) return
  eventBus.emit('scrollToNowPlaying')
}

const toggleMarks = () => {
  playerStore.marksVisible = !playerStore.marksVisible
}

const toggleMute = () => {
  if (player.value.player) {
    player.value.player.muted = !player.value.player.muted
    playerStore.muted = !player.value.muted
    let text = (player.value.volume * 100).toFixed() + " %"
    if (player.value.muted) text = "Muted"
    playerStore.changePlayerStatusText({
      text: text,
      icon: volumeIcon.value,
    })
  }
}

const changeVolume = (e) => {
  emit("changeVolume", e)
}

const changeSpeed = (e) => {
  playerStore.speed = e
  if (player.value.player) {
    player.value.player.playbackRate = e
  }

  playerStore.changePlayerStatusText({
    text: t('player.playback_speed', {speed: e == 1 ? t('common.normal').toLowerCase() : e}),
    icon: "play-speed",
  })
}

const addMark = () => {
  if (dialogsStore.markAdding.show) {
    dialogsStore.markAdding.show = false
  } else {
    emit("addMark")
  }
}

const removeMark = (mark) => {
  console.log(mark)
  emit("removeMark", mark)
}

const setAsThumb = async () => {
  if (!video.value) return

  const imgPath = path.join(
    appStore.mediaPath || '',
    "videos/thumbs",
    `${video.value.id}.jpg`
  )

  const time = new Date(player.value.currentTime * 1000)
    .toISOString()
    .substr(11, 8)

  try {
    await $operable.createThumb(time, video.value.path, imgPath, 320, true)
    emit('updateVideo', video.value.id)
    $operable.setNotification({
      title: t('player.video_thumb_updated'),
      text: video.value.path,
      icon: 'image',
      type: 'success',
    })
  } catch (e) {
    console.log(e)
    $operable.setNotification({
      title: t('player.video_thumb_not_updated'),
      text: e,
      icon: 'image',
      type: 'error',
    })
  }
}

const saveEvent = (e) => {
  preview_show.value = true
  preview_event_target.value = e.currentTarget
}

let previewRafId = null
let previewPendingX = null

const showPreview = (e) => {
  if (!preview_show.value || !preview_event_target.value || !controls_width.value) return

  previewPendingX = e.pageX
  if (previewRafId) return

  previewRafId = requestAnimationFrame(() => {
    previewRafId = null
    const pageX = previewPendingX
    if (pageX == null || !preview_event_target.value) return

    const currentTargetRect = preview_event_target.value.getBoundingClientRect()
    const left = pageX - currentTargetRect.left
    playerStore.progress_hover = left / controls_width.value * 100
  })
}

const editVideo = async () => {
  const videoData = await getVideo()
  video_editing.value = videoData
  dialog_video_edit.value = true
}

const getVideo = async () => {
  if (!video.value) return null

  let videoData = null
  let query = {
    mediaTypeId: 1,
    filters: [],
    sortBy: 'createdAt',
    direction: 'asc',
    find_duplicates: false,
    ids: [video.value.id],
  }

  try {
    const res = await axios.post(apiUrl.value + "/api/media/items", query)
    videoData = res.data.items[0]
  } catch (e) {
    console.log(e)
  }

  return videoData
}

const updateVideoInfo = async () => {
  if (!editingComponent.value || !editingComponent.value.save) return

  await editingComponent.value.save()
  const videoData = await getVideo()

  if (videoData) {
    player.value.playlist[player.value.nowPlaying] = videoData
  }

  dialog_video_edit.value = false
  emit('updateVideo', video.value.id)
}

const deleteVideo = async (with_file) => {
  if (!video.value) return

  const video_edit = _.cloneDeep(video.value)

  // переключаем на следующее видео
  if (isNextDisabled.value) {
    if (!isPrevDisabled.value) {
      await prev()
    } else {
      emit('close')
    }
  } else if (video.value.id === video_edit.id) {
    await next()
  }

  // удаляем из плейлиста
  const x = player.value.playlist.map(i => i.id).indexOf(video_edit.id)
  if (x > -1) {
    player.value.playlist.splice(x, 1)
  }

  // удаляем из БД
  setTimeout(async () => {
    try {
      await axios({
        method: "post",
        url: apiUrl.value + "/api/media/deleteOne",
        data: {
          type: "videos",
          id: video_edit.id,
          with_file: with_file,
          path: video_edit.path,
        },
      })

      // обновляем состояние на странице и фронте
      if (is_separate_window.value && window.electronAPI) {
        window.electronAPI.send("removeEntitiesFromState", {
          ids: [video_edit.id],
          type: 'media',
        })
      } else {
        eventBus.emit('removeEntitiesFromState', {
          detail: {
            ids: [video_edit.id],
            type: 'media',
          }
        })
      }
    } catch (e) {
      console.log(e)
    }
  }, 1000)
}

const resize = () => {
  ++resized.value
}

// Lifecycle
onMounted(() => {
  is_mounted.value = true
  window.addEventListener("resize", resize)
})

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize)
  if (previewRafId) {
    cancelAnimationFrame(previewRafId)
  }
})

// Watchers
watch(dialog_video_edit, (value) => {
  playerStore.stop_listen_keyboard_events = value
})

watch(() => dialogsStore.markAdding.show, (value) => {
  playerStore.stop_listen_keyboard_events = value
})

defineExpose({
  togglePause,
  play,
  pause,
  stop,
  prev,
  next,
  toggleMute,
  togglePlaylist,
  toggleMarks,
  jumpToMark,
  editVideo,
  deleteVideo,
  resize,
  // Добавьте все методы, которые нужны из родительского компонента
})
</script>