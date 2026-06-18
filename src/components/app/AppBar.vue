<template>
  <v-app-bar
    :color="colorRGBA"
    :class="{ 'os-darwin': isMac && !fullscreen }"
    density="compact"
    extension-height="36"
    :hide-on-scroll="xs"
    :style="gradient"
  >
    <!-- Gradient bg -->
    <!--    <template #image>-->
    <!--      <v-img :src="''" :gradient="gradient" cover/>-->
    <!--    </template>-->

    <div class="darwin-buttons-background"
      v-if="isMac && is_electron && !fullscreen"></div>
    <div class="darwin-buttons"
      v-if="isMac && is_electron && !fullscreen"></div>

    <!-- LEFT AREA -->
    <div class="app-bar-container px-1 d-flex align-center flex-1">
      <!--      <div class="scrollable">-->
      <!--        <div class="scrollable-child d-flex align-center">-->
      <ItemsSelection v-if="itemsStore.isSelect"/>

      <div
        v-if="itemsStore.type && !itemsStore.isSelect"
        :key="route.fullPath  + 'appbar'"
        class="d-flex align-center"
        style="height: 40px;"
      >

        <DialogMediaAdding v-if="itemsStore.type == 'media'"/>
        <TagsAdd v-if="itemsStore.type == 'tag'"/>
        <TagsAdd v-else :button="false"/>

        <ItemsFilter v-if="itemsStore.type"/>

        <!-- Sort -->
<!--        <AppBarButton-->
<!--          :icon="itemsStore.sortDir === 'asc' ? 'sort-ascending' : 'sort-descending'"-->
<!--          :text="t('appbar.buttons.sort')"-->
<!--          :active="toolbar.sort.show"-->
<!--          @click="toggleSort"-->
<!--        />-->

<!--        &lt;!&ndash; Customize &ndash;&gt;-->
<!--        <AppBarButton-->
<!--          icon="tune"-->
<!--          :text="t('appbar.buttons.customize')"-->
<!--          :active="toolbar.appearance.show"-->
<!--          @click="toggleCustomization"-->
<!--        />-->
        <AppBarButton
          :disabled="itemsStore.entities.length == 0"
          :action="() => itemsStore.toggleSelectMode()"
          :text="$t('appbar.buttons.select')"
          icon="checkbox-marked-outline"
          :active="itemsStore.isSelect"
        ></AppBarButton>

        <TabAdd/>

        <ItemsEditMeta v-if="itemsStore.type == 'tag'"/>

        <!-- Random -->
        <AppBarButton
          :disabled="itemsStore.entities.length == 0"
          icon="dice-5"
          :text="t('appbar.buttons.open_random')"
          :action="openRandomItem"
        />
        <!--          </div>-->
        <!--        </div>-->
      </div>

      <v-spacer/>

      <!-- RIGHT AREA -->
      <div class="d-flex align-center">
        <v-tooltip v-if="!reg"
          location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn v-bind:="props"
              @click="register"
              icon>
              <v-icon>mdi-lock-question</v-icon>
            </v-btn>
          </template>
          <span>
            APP NOT REGISTERED <br/>
            the number of items per page is limited to 15
          </span>
        </v-tooltip>

        <div class="mr-1">
          <GlobalSearch/>
        </div>
        <Feedback/>
        <Documentation/>
        <Notifications/>
      </div>
    </div>

    <!-- Tabs -->
    <template #extension
      v-if="tabs.length > 0">
      <div class="extension-tabs">
        <Tabs/>
      </div>
    </template>

    <DialogTabEditing/>
  </v-app-bar>
</template>

<script setup>
import {computed, onMounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useTheme, useDisplay} from 'vuetify'
import {useAppStore} from '@/stores/app'
import {useSettingsStore} from '@/stores/settings'
import {useItemsStore} from '@/stores/items'
import {useToolbarStore} from '@/stores/toolbar'
import {useDialogsStore} from '@/stores/dialogs'
import {useRegistrationStore} from '@/stores/registration'
import {useEventBus} from '@/utils/eventBus'
import {useI18n} from 'vue-i18n'
import {scrollMainTo} from '@/utils/mainScroll'

/* Components */
import ItemsSelection from '@/components/app/appbar/elements/ItemsSelection.vue'
import AppBarButton from '@/components/app/appbar/AppBarButton.vue'
import ItemsFilter from '@/components/app/appbar/elements/ItemsFilter.vue'
import TabAdd from '@/components/app/appbar/elements/TabAdd.vue'
import TagsAdd from '@/components/app/appbar/elements/TagsAdd.vue'
import DialogMediaAdding from '@/components/dialogs/DialogMediaAdding.vue'
import ItemsEditMeta from '@/components/app/appbar/elements/ItemsEditMeta.vue'
import Tabs from '@/components/app/appbar/Tabs.vue'
import Feedback from '@/components/app/appbar/Feedback.vue'
import Documentation from '@/components/app/appbar/Documentation.vue'
import GlobalSearch from '@/components/app/appbar/GlobalSearch.vue'
import Notifications from '@/components/app/appbar/Notifications.vue'
import DialogTabEditing from '@/components/dialogs/DialogTabEditing.vue'

/* Stores */
const itemsStore = useItemsStore()
const settingsStore = useSettingsStore()
const toolbarStore = useToolbarStore()
const app = useAppStore()
const dialogs = useDialogsStore()
const registrationStore = useRegistrationStore()
const eventBus = useEventBus()

/* Router & i18n */
const route = useRoute()
const router = useRouter()
const {t} = useI18n()

/* Vuetify Theme */
const theme = useTheme()
const {platform, xs} = useDisplay()


/* macOS detection */
const isMac = platform.value.mac
const is_electron = platform.value.electron

/* Fullscreen state */
const fullscreen = ref(false)

/* Colors */
const tabs = computed(() => app.tabs)
const settings = computed(() => settingsStore)
const toolbar = computed(() => toolbarStore)
const reg = computed(() => registrationStore.reg)

const color = computed(() => {
  const c = theme.global.current.value.dark
    ? settings.value.appColorDarkHeader
    : settings.value.appColorLightHeader

  // change meta theme-color
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', c || '#000000')

  return c || '#000000'
})

// plugin readable
const colorRGBA = computed(() => {
  return $readable.hexToRgba(color.value, 60)
})

/* Gradient */
const gradient = computed(() => {
  if (settings.value.headerGradient == '0') return ''

  let g = theme.global.current.value.dark
    ? settings.value.headerGradientDark
    : settings.value.headerGradientLight

  if (!g || typeof g !== 'string') return ''

  return 'background:' + $readable.addTransparencyToGradient(g, 0.6)
})

const barTheme = computed(() => {
  if (color.value) {
    return $readable.checkColorForDarkText(color.value) ? 'dark' : 'light'
  } else {
    return 'dark'
  }
})

/* Methods */
function toggleSort() {
  toolbar.value.sort.type = itemsStore.type
  toolbar.value.sort.show = !toolbar.value.sort.show
  if (toolbar.value.sort.show) scrollTop()
}

function toggleCustomization() {
  toolbar.value.appearance.show = !toolbar.value.appearance.show
  if (toolbar.value.appearance.show) scrollTop()
}

function scrollTop() {
  scrollMainTo({ top: 0, behavior: 'smooth' })
}

function openRandomItem() {
  const ids = itemsStore.entities.map(i => i.id)
  if (ids.length > 0) {
    const rand = Math.floor(Math.random() * ids.length)
    eventBus.emit('openRandomItem', ids[rand])
  }
}

function register() {
  if (router.currentRoute !== "Settings") {
    router.push("/settings/?tab=about")
  }
}

/* Electron events */
onMounted(() => {
  if (window.electronAPI) {
    window.electronAPI.on('enter-full-screen', () => {
      fullscreen.value = true
    })
    window.electronAPI.on('leave-full-screen', () => {
      fullscreen.value = false
    })
  }
})
</script>

<style scoped
  lang="scss">
.darwin-buttons {
  width: 96px;
  height: 36px;
  backdrop-filter: blur(20px);
  border-radius: 25px;
  margin-left: 5px;
}

.darwin-buttons-background {
  position: fixed;
  z-index: 5000;
  left: 10px;
  top: 10px;
  border-radius: 15px;
  width: 76px;
  height: 25px;
  backdrop-filter: blur(10px);
}

.scrollable {
  overflow-x: auto;
  max-width: 60vw;
}

.extension-tabs {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
}

.scrollable-child {
  display: flex;
  align-items: center;
}
</style>
