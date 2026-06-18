<template>
  <div>
    <!-- Main Dialog for Gradient Editor -->
    <v-dialog v-model="dialogHeaderGradient" width="600" scrollable persistent>
      <v-card rounded="lg">
        <v-card
          class="d-flex justify-space-between"
          :style="{ background: gradient }"
          :light="!themeDark"
          :dark="themeDark"
          elevation="0"
        >
          <div class="text-h6 ma-4">
            {{ t('settings_labels.appearance.gradient_for_theme', {theme: themeDark ? t('settings_labels.appearance.dark_theme').toLowerCase() : t('settings_labels.appearance.light_theme').toLowerCase()}) }}
          </div>
          <div
            class="d-flex flex-sm-row flex-column-reverse justify-end ma-sm-4 ma-2"
          >
            <v-btn @click="close" variant="outlined">
              <v-icon start>mdi-close</v-icon>
              {{ t('common.cancel') }}
            </v-btn>
            <v-spacer class="ma-sm-2 ma-1"></v-spacer>
            <v-btn @click="apply" color="success" variant="flat">
              <v-icon start>mdi-check</v-icon>
              {{ t('common.apply') }}
            </v-btn>
          </div>
        </v-card>

        <v-card-text class="py-4">
          <draggable
            v-model="colors"
            v-bind="dragOptions"
            item-key="id"
            tag="div"
          >
            <template #item="{ element: color, index }">
              <div class="d-flex justify-center align-center mb-4">
                <v-tooltip location="top">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" size="x-small" icon class="mr-4">
                      <v-icon>mdi-drag</v-icon>
                    </v-btn>
                  </template>
                  <span>{{ t('settings_labels.appearance.drag_to_change_order') }}</span>
                </v-tooltip>

                <v-btn
                  @click="openDialogPalette(index)"
                  variant="tonal"
                  rounded
                >
                  <v-icon start :color="color.hex">mdi-circle</v-icon>
                  {{ t('settings_labels.appearance.change_color') }}
                </v-btn>

                <v-tooltip location="top">
                  <template v-slot:activator="{ props }">
                    <v-btn
                      v-bind="props"
                      @click="lockColor(index)"
                      size="x-small"
                      class="ml-4"
                      icon
                    >
                      <v-icon v-if="color.disabled">mdi-lock</v-icon>
                      <v-icon v-else>mdi-lock-open-variant</v-icon>
                    </v-btn>
                  </template>
                  <span>{{ t('settings_labels.appearance.exclude_from_randomization') }}</span>
                </v-tooltip>
              </div>
            </template>
          </draggable>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-btn @click="addColor" icon size="x-small" variant="tonal" color="success">
            <v-icon>mdi-plus</v-icon>
          </v-btn>

          <transition name="fade">
            <v-btn
              @click="removeColor"
              v-if="colors.length > 2"
              size="x-small"
              variant="tonal"
              color="error"
              icon
            >
              <v-icon>mdi-minus</v-icon>
            </v-btn>
          </transition>

          <v-spacer></v-spacer>

          <v-btn @click="generateGradient" variant="outlined" class="px-4" rounded>
            <v-icon start>mdi-dice-5</v-icon>
            {{ t('settings_labels.appearance.launch_randomizer') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Color Picker Dialog -->
    <v-dialog v-model="dialogPalette" width="300">
      <v-card rounded="lg">
        <div class="pa-2">
          <v-btn @click="applyColor" color="success" block variant="flat">
            <v-icon start>mdi-check</v-icon>
            {{ t('common.apply') }}
          </v-btn>
        </div>
        <v-color-picker
          v-model="palette"
          @update:model-value="changeColor"
          mode="hex"
          hide-mode-switch
        />
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, nextTick} from 'vue'
import {useI18n} from 'vue-i18n'
import draggable from 'vuedraggable'
import {useSettingsStore} from '@/stores/settings'
import {useTheme} from 'vuetify'

// Props
const props = defineProps({
  themeDark: {
    type: Boolean,
    required: true
  }
})

const {t} = useI18n()

// Emits
const emit = defineEmits(['close', 'save'])

// Stores and Theme
const settingsStore = useSettingsStore()
const theme = useTheme()

// State
const dialogHeaderGradient = ref(false)
const dialogPalette = ref(false)
const colors = ref([])
const palette = ref('#435121')
const colorIndex = ref(0)

// Draggable options
const dragOptions = {
  animation: 200,
  disabled: false,
  ghostClass: 'ghost',
}

// Computed
const gradient = computed(() => {
  const colorValues = colors.value.map(c => c.hex).join(', ')
  return `linear-gradient(to right, ${colorValues})`
})

const savedGradient = computed(() => {
  return props.themeDark
    ? settingsStore.headerGradientDark
    : settingsStore.headerGradientLight
})

// Methods
const initColors = () => {
  colors.value = []

  if (!savedGradient.value) {
    // Default gradient if none saved
    const defaultColors = props.themeDark
      ? ['#1a237e', '#311b92', '#4a148c']
      : ['#bbdefb', '#90caf9', '#64b5f6']

    defaultColors.forEach((color, index) => {
      colors.value.push({
        id: Date.now() + index,
        hex: color,
        disabled: false
      })
    })
    return
  }

  // Parse saved gradient
  try {
    const gradientStr = savedGradient.value
      .replace('linear-gradient(to right,', '')
      .replace(')', '')
      .trim()

    const colorArray = gradientStr.split(',').map(c => c.trim())

    colorArray.forEach((color, index) => {
      colors.value.push({
        id: Date.now() + index,
        hex: color,
        disabled: false
      })
    })
  } catch (error) {
    console.error('Error parsing gradient:', error)
    // Fallback to default
    initColors()
  }
}

const openDialogPalette = (index) => {
  dialogPalette.value = true
  colorIndex.value = index
  palette.value = colors.value[index].hex
}

const changeColor = (color) => {
  // color может быть объектом или строкой в зависимости от color-picker
  if (typeof color === 'object' && color.hex) {
    palette.value = color.hex
  } else if (typeof color === 'string') {
    palette.value = color
  }
}

const applyColor = () => {
  colors.value[colorIndex.value].hex = palette.value
  dialogPalette.value = false
}

const addColor = () => {
  colors.value.push({
    id: Date.now() + colors.value.length,
    hex: randomHex(),
    disabled: false
  })
}

const removeColor = () => {
  if (colors.value.length > 2) {
    const lastColor = colors.value[colors.value.length - 1]
    if (!lastColor.disabled) {
      colors.value.pop()
    }
  }
}

const generateGradient = () => {
  colors.value.forEach((color, index) => {
    if (!color.disabled) {
      colors.value[index].hex = randomHex()
    }
  })
}

const lockColor = (index) => {
  colors.value[index].disabled = !colors.value[index].disabled
}

const randomHex = () => {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

const close = () => {
  emit('close')
}

const apply = () => {
  const values = {
    gradient: gradient.value,
    themeDark: props.themeDark
  }
  emit('save', values)
  close()
}

// Lifecycle
onMounted(() => {
  nextTick(() => {
    dialogHeaderGradient.value = true
    initColors()
  })
})
</script>