<template>
  <v-container ref="container">
    <div class="text-md-h2 d-flex align-center my-6">
      <v-icon size="42" start>mdi-format-list-bulleted</v-icon>
      {{ t('navigation.playlists') }}
    </div>

    <template v-if="is_dynamic_loading || dynamicPlaylists.length">
      <div class="section-title text-h5 mb-4 d-flex align-center">
        <v-icon start>mdi-filter-variant</v-icon>
        {{ t('playlists.dynamic_playlists') }}
      </div>

      <div
        v-if="is_dynamic_loading"
        class="playlists-grid mb-4"
      >
        <PlaylistCard
          v-for="index in dynamicCardsPerRow"
          :key="`dynamic-skeleton-card-${index}`"
          :playlist="dynamicSkeletonPlaylist"
          :loading="true"
          :show-edit="false"
        />
      </div>

      <div
        v-else-if="dynamicFeatured.length"
        class="playlists-grid mb-4"
      >
        <PlaylistCard
          v-for="playlist in dynamicFeatured"
          :key="`dynamic-card-${playlist.id}`"
          :playlist="playlist"
          :video-count="playlist.count"
          :thumbs-loading="!is_dynamic_thumbs_loaded"
          :playing="playingPlaylistId === playlist.id"
          :show-edit="false"
          @play="playDynamic(playlist)"
        />
      </div>

      <div
        v-if="is_dynamic_loading"
        class="dynamic-playlists-list mb-10"
      >
        <DynamicPlaylistRow
          v-for="index in dynamicRowSkeletonCount"
          :key="`dynamic-skeleton-row-${index}`"
          :playlist="dynamicSkeletonPlaylist"
          skeleton
        />
      </div>

      <div
        v-else-if="dynamicList.length"
        class="dynamic-playlists-list mb-10"
      >
        <DynamicPlaylistRow
          v-for="playlist in dynamicList"
          :key="`dynamic-row-${playlist.id}`"
          :playlist="playlist"
          :thumbs-loading="!is_dynamic_thumbs_loaded"
          :playing="playingPlaylistId === playlist.id"
          @play="playDynamic(playlist)"
        />
      </div>
    </template>

    <div class="section-title text-h5 mb-4 d-flex align-center">
      <v-icon start>mdi-playlist-play</v-icon>
      {{ t('playlists.manual_playlists') }}
    </div>

    <v-btn @click="dialogPlaylistAdd = true" color="success" class="mb-8" rounded depressed>
      <v-icon start>mdi-playlist-plus</v-icon>
      {{ t('playlists.add_new_playlist') }}
    </v-btn>

    <div v-if="playlists.length == 0 && is_manual_loaded" class="layout-img">
      <v-img src="/images/no-data.svg" max-height="40vh" class="my-4" contain></v-img>
      <div class="text--secondary">{{ t('empty_states.no_items_add_first') }}</div>
    </div>

    <div v-else class="playlists-grid">
      <PlaylistCard
        v-for="playlist in playlists"
        :key="playlist.id"
        :playlist="playlist"
        :thumbs-loading="!is_thumbs_loaded"
        :playing="playingPlaylistId === `manual-${playlist.id}`"
        @play="play(playlist)"
        @edit="edit(playlist)"
      />
    </div>

    <DialogPlaylistAdd
      v-if="dialogPlaylistAdd"
      @close="dialogPlaylistAdd = false"
      @add="addNewPlaylist"
      :dialog="dialogPlaylistAdd"
    />

    <DialogPlaylistEdit
      v-if="dialogPlaylistEdit"
      @close="dialogPlaylistEdit = false"
      @delete="deletePlaylist"
      @updatePlaylist="getPlaylists"
      :dialog="dialogPlaylistEdit"
      :playlist="playlist_edit"
    />
  </v-container>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import {useI18n} from 'vue-i18n'
import {useDisplay} from 'vuetify'
import {useAppStore} from '@/stores/app'
import {useItemsStore} from '@/stores/items'
import {usePlayerStore} from '@/stores/player'
import axios from "axios"
import DialogPlaylistAdd from "@/components/dialogs/DialogPlaylistAdd.vue"
import DialogPlaylistEdit from "@/components/dialogs/DialogPlaylistEdit.vue"
import PlaylistCard from "@/components/playlists/PlaylistCard.vue"
import DynamicPlaylistRow from "@/components/playlists/DynamicPlaylistRow.vue"
import {loadPlaylistThumbs} from '@/utils/playlistThumbs'

const appStore = useAppStore()
const itemsStore = useItemsStore()
const playerStore = usePlayerStore()
const {t} = useI18n()
const {width} = useDisplay()

const container = ref(null)
const playlists = ref([])
const dynamicPlaylists = ref([])
const is_thumbs_loaded = ref(false)
const is_manual_loaded = ref(false)
const is_dynamic_loading = ref(false)
const is_dynamic_thumbs_loaded = ref(false)
const playingPlaylistId = ref(null)
const dialogPlaylistEdit = ref(false)
const dialogPlaylistAdd = ref(false)
const playlist_edit = ref(null)

const apiUrl = computed(() => appStore.localhost)

const dynamicCardsPerRow = computed(() => {
  if (width.value >= 1900) return 5
  if (width.value >= 1500) return 4
  if (width.value >= 1200) return 3
  if (width.value >= 900) return 2
  return 1
})

const dynamicFeatured = computed(() => dynamicPlaylists.value.slice(0, dynamicCardsPerRow.value))
const dynamicList = computed(() => dynamicPlaylists.value.slice(dynamicCardsPerRow.value))
const dynamicRowSkeletonCount = 4
const dynamicSkeletonPlaylist = {name: '', thumbs: [], count: 0}

const enrichMediaItem = (item) => ({
  ...item,
  tags: item.tags || [],
  values: item.values || [],
  key: String(item.id),
})

const playVideos = async (videos) => {
  if (!videos?.length) return

  await itemsStore.playVideo({
    video: videos[0],
    videos,
    trustPath: true,
  })
}

const play = async (playlist) => {
  if (!playlist.media?.length || playingPlaylistId.value) return

  playingPlaylistId.value = `manual-${playlist.id}`

  try {
    await playVideos(playlist.media)
  } finally {
    playingPlaylistId.value = null
  }
}

const playDynamic = async (playlist) => {
  if (!playlist.count || playingPlaylistId.value) return

  playingPlaylistId.value = playlist.id
  let started = false

  try {
    const firstId = playlist.previewIds?.[0]

    if (firstId) {
      try {
        const basicsRes = await axios.post(`${apiUrl.value}/api/media/basics`, {
          ids: [firstId],
        })
        const firstVideo = basicsRes.data?.items?.[0]

        if (firstVideo) {
          await playVideos([enrichMediaItem(firstVideo)])
          started = true
        }
      } catch (e) {
        console.log('Quick play failed, loading full playlist:', e)
      }
    }

    const res = await axios.get(`${apiUrl.value}/api/SavedFilter/${playlist.id}/media`, {
      params: {mode: 'play'},
    })
    const videos = (res.data.items || []).map(enrichMediaItem)

    if (!videos.length) {
      if (!started) {
        $operable.setNotification({
          type: 'error',
          title: t('playlists.no_videos_added'),
        })
      }
      return
    }

    if (started && playerStore.active) {
      playerStore.setPlaylistItems(videos, {host: apiUrl.value})
      return
    }

    await playVideos(videos)
  } catch (e) {
    console.log('Error loading dynamic playlist videos:', e)
    $operable.setNotification({
      type: 'error',
      title: t('playlists.preparing_playback_failed'),
    })
  } finally {
    playingPlaylistId.value = null
  }
}

const loadDynamicPlaylists = async () => {
  is_dynamic_loading.value = true
  is_dynamic_thumbs_loaded.value = false

  try {
    const res = await axios.get(`${apiUrl.value}/api/SavedFilter/dynamicPlaylists`)
    dynamicPlaylists.value = (res.data || []).map((playlist) => ({
      ...playlist,
      thumbs: [],
    }))
  } catch (e) {
    console.log('Error loading dynamic playlists:', e)
    dynamicPlaylists.value = []
  } finally {
    is_dynamic_loading.value = false
  }

  if (!dynamicPlaylists.value.length) {
    is_dynamic_thumbs_loaded.value = true
    return
  }

  try {
    await loadPlaylistThumbs(dynamicPlaylists.value)
  } catch (e) {
    console.log('Error loading dynamic playlist thumbs:', e)
  } finally {
    is_dynamic_thumbs_loaded.value = true
  }
}

const getPlaylists = async () => {
  is_manual_loaded.value = false
  is_thumbs_loaded.value = false

  try {
    const res = await axios.get(`${apiUrl.value}/api/playlist/summary`)
    playlists.value = (res.data || []).map((playlist) => ({
      ...playlist,
      thumbs: [],
    }))
    is_manual_loaded.value = true
    is_thumbs_loaded.value = true
    loadPlaylistThumbs(playlists.value)
  } catch (e) {
    console.log('Error loading playlists:', e)
    playlists.value = []
    is_manual_loaded.value = true
    is_thumbs_loaded.value = true
  }
}

const loadAllPlaylists = async () => {
  await getPlaylists()
  loadDynamicPlaylists()
}

const deletePlaylist = async () => {
  dialogPlaylistEdit.value = false

  try {
    await axios({
      method: "delete",
      url: apiUrl.value + "/api/playlist/" + playlist_edit.value.id,
    })
  } catch (e) {
    console.log(e)
  }

  await getPlaylists()
}

const addNewPlaylist = async () => {
  dialogPlaylistAdd.value = false
  await getPlaylists()
}

const edit = (playlist) => {
  playlist_edit.value = playlist
  dialogPlaylistEdit.value = true
}

onMounted(() => {
  loadAllPlaylists()
})
</script>

<style lang="scss" scoped>
.playlists-grid {
  display: grid;
  gap: 20px 16px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.dynamic-playlists-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  font-weight: 600;
}
</style>
