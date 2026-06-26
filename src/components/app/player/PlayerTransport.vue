<template>
  <v-card-actions class="buttons pb-4 px-0 pt-0">
    <v-btn @click="togglePause"
      icon
      variant="tonal"
      :density="density"
      dark>
      <v-icon v-if="player.paused" large>mdi-play</v-icon>
      <v-icon v-else large>mdi-pause</v-icon>
      <div class="tip" style="left: 0">
        <span class="mr-2"
          v-html="player.paused ? t('player.controls.play') : t('player.controls.pause')"/>
        <v-hotkey keys="Space"/>
      </div>
    </v-btn>

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
          <span class="mr-2" v-html="t('player.controls.previous')"/>
          <v-hotkey keys="z"/>
          {{ t('common.or') }}
          <v-hotkey keys="alt+left"/>
        </div>
      </v-btn>

      <v-btn @click="stop" icon dark>
        <v-icon>mdi-stop</v-icon>
        <div class="tip">
          <span class="mr-2" v-html="t('player.controls.stop')"/>
          <v-hotkey keys="x"/>
        </div>
      </v-btn>

      <v-btn @click="next"
        :disabled="isNextDisabled"
        icon
        dark>
        <v-icon>mdi-skip-next</v-icon>
        <div class="tip">
          <span class="mr-2" v-html="t('player.controls.next')"/>
          <v-hotkey keys="c"/>
          {{ t('common.or') }}
          <v-hotkey keys="alt+right"/>
        </div>
      </v-btn>
    </v-btn-group>

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
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps"
            icon
            variant="tonal"
            :density="density"
            dark>
            <v-icon>mdi-play-speed</v-icon>
            <div class="tip" v-html="t('player.playback_speed_label')"/>
          </v-btn>
        </template>

        <v-list density="compact" class="py-1">
          <v-list-item-group
            :model-value="player.speed"
            @update:model-value="changeSpeed"
            color="primary"
          >
            <v-list-item v-for="speed in speeds"
              :key="speed"
              :value="speed">
              <v-list-item-title v-text="speed == 1 ? t('common.normal') : speed"/>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-menu>
    </div>

    <v-spacer/>

    <v-btn-group variant="tonal"
      :density="density"
      rounded="xl"
      style="overflow: visible"
      dark
      class="mark-buttons px-0">
      <v-btn @click="toggleMarks" icon dark>
        <v-icon size="20" v-if="player.marksVisible">mdi-tooltip</v-icon>
        <v-icon size="20" v-else>mdi-tooltip-outline</v-icon>
        <div class="tip">
          <span class="mr-2">{{ t('player.marks_list') }}</span>
          <v-hotkey keys="m"/>
        </div>
      </v-btn>

      <v-btn @click="addMark" icon dark>
        <v-icon v-if="dialogsStore.markAdding.show">mdi-plus-circle</v-icon>
        <v-icon v-else>mdi-plus</v-icon>
        <div class="tip">
          <span class="mr-2" v-html="t('player.controls.add_mark')"/>
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

    <v-btn-group v-if="video"
      variant="tonal"
      :density="density"
      rounded="xl"
      style="overflow: visible"
      dark
      class="btn-edit-video px-0">
      <v-btn v-if="!isAudioMode"
        @click="setAsThumb"
        class="action-buttons"
        icon
        dark>
        <v-icon>mdi-image-outline</v-icon>
        <div class="tip" v-html="t('player.controls.set_frame_as_thumb')"/>
      </v-btn>

      <v-btn @click="editVideo" icon dark>
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

          <v-card-text :key="video_editing.id" class="pt-4 px-0">
            <EditPinnedMetaValues
              v-if="video_editing"
              @close="dialogsStore.mediaEditing.show = false"
              :media="video_editing"
              ref="editingComponent"
            />
          </v-card-text>
        </v-card>
      </v-dialog>

      <v-menu
        attach=".btn-edit-video"
        location="top"
        :offset="8"
        width="180"
      >
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps"
            style="border-top-right-radius: 24px; border-bottom-right-radius: 24px;"
            icon
            dark
          >
            <v-icon>mdi-delete-outline</v-icon>
            <div class="tip">
              <span class="mr-2" v-html="t('player.controls.delete_video')"/>
              <v-hotkey keys="alt+del"/>
            </div>
          </v-btn>
        </template>

        <v-list density="compact" class="py-1">
          <v-list-item @click="deleteVideo(true)">
            <v-list-item-title>
              <v-icon class="mr-4" icon="mdi-delete-alert" color="error"/>
              <span>{{ t('actions.delete_with_file') }}</span>
            </v-list-item-title>
          </v-list-item>

          <v-list-item @click="deleteVideo()">
            <v-list-item-title>
              <v-icon class="mr-4" icon="mdi-delete" color="error"/>
              <span>{{ t('common.delete') }}</span>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-btn-group>

    <v-spacer/>

    <v-btn-group variant="tonal"
      :density="density"
      rounded="xl"
      style="overflow: visible"
      dark
      class="px-0 mr-2">
      <v-btn @click="$emit('toggleFullscreen')" icon dark>
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
        v-if="!isAudioMode"
        @click="$emit('togglePictureInPicture')"
        class="toggle-picture-in-picture"
        icon
        dark
      >
        <v-icon size="20">mdi-picture-in-picture-bottom-right</v-icon>
        <div class="tip" v-html="t('player.controls.picture_in_picture')"/>
      </v-btn>
    </v-btn-group>

    <v-btn-group @wheel.prevent="handleVolumeWheel"
      variant="tonal"
      :density="density"
      rounded="xl"
      style="overflow: visible"
      dark
      class="volume px-0">
      <v-btn @click="toggleMute" icon dark>
        <v-icon>mdi-{{ volumeIcon }}</v-icon>
        <div class="tip">
          <span class="mr-2" v-html="t('player.controls.mute')"/>
          <v-hotkey keys="m"/>
        </div>
      </v-btn>
      <v-slider
        v-model="playerStore.volume"
        @wheel.prevent.stop="handleVolumeSliderWheel"
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
</template>

<script setup>
import {useI18n} from 'vue-i18n'
import DialogHeader from '@/components/elements/DialogHeader.vue'
import EditPinnedMetaValues from '@/components/items/EditPinnedMetaValues.vue'
import {usePlayerTransport} from '@/composable/usePlayerTransport'

const props = defineProps({
  jumpToMark: {
    type: Function,
    required: true,
  },
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
  'updateVideo',
])

const {t} = useI18n()

const jumpToMark = (type) => props.jumpToMark(type)

const {
  player,
  playerStore,
  dialogsStore,
  editingComponent,
  speeds,
  video_editing,
  dialog_video_edit,
  video,
  isAudioMode,
  density,
  xs,
  xl,
  isPrevDisabled,
  isNextDisabled,
  volumeIcon,
  msToTime,
  togglePause,
  play,
  pause,
  stop,
  prev,
  next,
  togglePlaylist,
  toggleMarks,
  toggleMute,
  handleVolumeWheel,
  handleVolumeSliderWheel,
  changeSpeed,
  addMark,
  setAsThumb,
  editVideo,
  updateVideoInfo,
  deleteVideo,
} = usePlayerTransport({
  emit,
  jumpToMark,
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
})
</script>
