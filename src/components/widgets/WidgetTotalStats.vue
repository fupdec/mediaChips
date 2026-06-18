<template>
  <v-row class="mb-4">
    <v-col cols="12" md="3" sm="6">
      <v-card class="rounded-xl card-total" color="primary" variant="tonal">
        <v-card-title class="text-h3 card-total-title">{{ animatedTags }}</v-card-title>
        <v-card-title class="text-h5 card-total-title card-total-label">{{ t('widgets.stats.tags') }}</v-card-title>
        <v-icon class="icon">mdi-tag</v-icon>
      </v-card>
    </v-col>

    <v-col cols="12" md="3" sm="6">
      <v-card class="rounded-xl card-total" color="primary" variant="tonal">
        <v-card-title class="text-h3 card-total-title">{{ animatedMetas }}</v-card-title>
        <v-card-title class="text-h5 card-total-title card-total-label">{{ t('widgets.stats.meta') }}</v-card-title>
        <v-icon class="icon">mdi-shape</v-icon>
      </v-card>
    </v-col>

    <v-col cols="12" md="3" sm="6">
      <v-card class="rounded-xl card-total" color="primary" variant="tonal">
        <v-card-title class="text-h3 card-total-title">{{ animatedFiles }}</v-card-title>
        <v-card-title class="text-h5 card-total-title card-total-label">{{ t('widgets.stats.files') }}</v-card-title>
        <v-icon class="icon">mdi-file</v-icon>
      </v-card>
    </v-col>

    <v-col cols="12" md="3" sm="6">
      <v-card class="rounded-xl card-total" color="primary" variant="tonal">
        <v-card-title class="text-h3 card-total-title">
          {{ animatedFilesize }} <span class="text-h5">{{ filesizeText }}</span>
        </v-card-title>
        <v-card-title class="text-h5 card-total-title card-total-label">{{ t('widgets.stats.disk_space') }}</v-card-title>
        <v-icon class="icon">mdi-harddisk</v-icon>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import {ref, computed, onMounted, watch} from "vue"
import axios from "axios"
import {gsap} from "gsap"
import {useAppStore} from "@/stores/app"
import {useI18n} from 'vue-i18n'

const store = useAppStore()
const {t} = useI18n()

/* ---------------------- State ---------------------- */

const numberTags = ref(0)
const numberMetas = ref(0)
const numberFiles = ref(0)
const numberFilesize = ref(0)

const tweenedTags = ref(0)
const tweenedMetas = ref(0)
const tweenedFiles = ref(0)
const tweenedFilesize = ref(0)

const filesizeText = ref("")

/* ---------------------- Computed ---------------------- */

const apiUrl = computed(() => store.localhost)

const animatedTags = computed(() => tweenedTags.value.toFixed(0))
const animatedMetas = computed(() => tweenedMetas.value.toFixed(0))
const animatedFiles = computed(() => tweenedFiles.value.toFixed(0))
const animatedFilesize = computed(() => tweenedFilesize.value.toFixed(2))

/* ---------------------- API ---------------------- */

async function getStats() {
  try {
    const res = await axios.get(apiUrl.value + "/api/media/get-stats")

    numberFiles.value = res.data.total

    const readable = $readable.getReadableFileSize(res.data.filesize, true)
    numberFilesize.value = readable.number
    filesizeText.value = readable.text

  } catch (e) {
    console.error(e)
  }
}

/* ---------------------- Animations ---------------------- */

function animate(refValue, tweened) {
  gsap.to(tweened, {duration: 1, value: refValue.value, ease: "power2.out"})
}

watch(numberTags, () => animate(numberTags, tweenedTags))
watch(numberMetas, () => animate(numberMetas, tweenedMetas))
watch(numberFiles, () => animate(numberFiles, tweenedFiles))
watch(numberFilesize, () => animate(numberFilesize, tweenedFilesize))

/* ---------------------- Mounted ---------------------- */

onMounted(async () => {
  await getStats()

  numberTags.value = store.tags.length
  numberMetas.value = store.meta.length
})
</script>

<style lang="scss" scoped>
.card-total {
  height: 100%;
  position: relative;
  isolation: isolate;
  text-align: left;
  overflow: hidden;

  .card-total-title {
    position: relative;
    z-index: 2;
  }

  .card-total-label {
    padding-right: 64px;
  }

  .icon {
    position: absolute;
    right: 15px;
    bottom: 15px;
    z-index: 1;
    opacity: 0.25;
    font-size: 35px;
    pointer-events: none;
  }
}
</style>
