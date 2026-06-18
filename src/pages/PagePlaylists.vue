<template>
  <v-container ref="container">
    <div class="text-md-h2 d-flex align-center my-6">
      <v-icon size="42" start>mdi-format-list-bulleted</v-icon>
      {{ t('navigation.playlists') }}
    </div>

    <v-btn @click="dialogPlaylistAdd = true" color="success" class="mb-8" rounded depressed>
      <v-icon start>mdi-playlist-plus</v-icon>
      {{ t('playlists.add_new_playlist') }}
    </v-btn>

    <div v-if="playlists.length == 0" class="layout-img">
      <v-img src="/images/no-data.svg" max-height="40vh" class="my-4" contain></v-img>
      <div class="text--secondary">{{ t('empty_states.no_items_add_first') }}</div>
    </div>

    <div v-else class="playlists-grid">
      <v-card v-for="i in playlists" :key="i.id" rounded="lg" :loading="false">
        <div v-if="is_thumbs_loaded" @click="play(i)" v-ripple="{ class: 'primary--text' }" class="thumbs">
          <v-img v-for="thumb in i.thumbs" :key="thumb" :src="thumb" width="50%"
                 :aspect-ratio="16/9" style="background: black;"></v-img>
        </div>
        <v-card-title @click="edit(i)" v-ripple="{ class: 'primary--text' }">{{ i.name }}</v-card-title>
      </v-card>
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
import {ref, onMounted, computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {useAppStore} from '@/stores/app'
import {useItemsStore} from '@/stores/items'
import axios from "axios"
import path from 'path-browserify'
import DialogPlaylistAdd from "@/components/dialogs/DialogPlaylistAdd.vue"
import DialogPlaylistEdit from "@/components/dialogs/DialogPlaylistEdit.vue"

const appStore = useAppStore()
const itemsStore = useItemsStore()
const {t} = useI18n()

// Refs
const container = ref(null)
const playlists = ref([])
const is_thumbs_loaded = ref(false)
const dialogPlaylistEdit = ref(false)
const dialogPlaylistAdd = ref(false)
const playlist_edit = ref(null)

// Computed
const apiUrl = computed(() => appStore.localhost)

// Methods
const getPlaylists = async () => {
  is_thumbs_loaded.value = false

  try {
    const res = await axios({
      method: "get",
      url: apiUrl.value + "/api/playlist/",
    })

    // appStore.playlists = res.data // Если есть соответствующее свойство в хранилище
    playlists.value = res.data

    // Загружаем медиа для каждого плейлиста
    for (const p of playlists.value) {
      try {
        const mediaRes = await axios({
          method: "get",
          url: apiUrl.value + "/api/MediaInPlaylists/" + p.id,
        })

        p.media = mediaRes.data.map(i => i.medium)

        // Загружаем превью для первых 5 видео
        const videos = p.media.slice(0, 5)
        p.thumbs = []

        for (let i of videos) {
          const imgPath = path.join(
            appStore.mediaPath,
            "videos/thumbs",
            i.id + ".jpg"
          )

          const thumb = await $operable.getLocalImage(imgPath)
          p.thumbs.push(thumb)
        }
      } catch (e) {
        console.log('Error loading playlist media:', e)
        p.media = []
        p.thumbs = []
      }
    }

    is_thumbs_loaded.value = true
  } catch (e) {
    console.log('Error loading playlists:', e)
    is_thumbs_loaded.value = true
  }
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

const play = async (playlist) => {
  if (!playlist.media || playlist.media.length === 0) return

  const videoIds = playlist.media.map(i => i.id)
  let videos = []

  for (const id of videoIds) {
    try {
      const res = await axios({
        method: "get",
        url: apiUrl.value + "/api/media/" + id,
      })
      videos.push(res.data)
    } catch (e) {
      console.log('Error loading video:', e)
    }
  }

  if (videos.length === 0) return

  await itemsStore.playVideo({
    video: videos[0],
    videos: videos,
  })
}

// Lifecycle
onMounted(() => {
  getPlaylists()
})
</script>

<style lang="scss" scoped>
.playlists-grid {
  display: grid;
  grid-gap: 15px 10px;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));

  .v-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .thumbs {
    display: flex;
    flex-direction: row;
    align-content: flex-start;
    flex-wrap: wrap;
    position: relative;
    overflow: hidden;
    background-color: #000000;
    cursor: pointer;
    height: 100%;
  }
}
</style>