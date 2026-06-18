import {computed} from 'vue'
import {useTheme} from 'vuetify'
import {useSettingsStore} from '@/stores/settings'
import {isWinElectronUi} from '@/utils/debugWinElectronUi'

export function useHeaderBarStyle(variant = 'app') {
  const theme = useTheme()
  const settingsStore = useSettingsStore()
  const isWinElectron = isWinElectronUi()

  const SETTINGS = computed(() => settingsStore)

  const color = computed(() => {
    const c = theme.global.current.value.dark
      ? SETTINGS.value.appColorDarkHeader
      : SETTINGS.value.appColorLightHeader

    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', c || '#000000')

    return c || '#000000'
  })

  const colorRGBA = computed(() => {
    if (isWinElectron) {
      return color.value
    }

    const opacity = variant === 'system' ? 80 : 60
    return $readable.hexToRgba(color.value, opacity)
  })

  const gradient = computed(() => {
    if (SETTINGS.value.headerGradient == '0') return ''

    const g = theme.global.current.value.dark
      ? SETTINGS.value.headerGradientDark
      : SETTINGS.value.headerGradientLight

    if (!g || typeof g !== 'string') return ''

    let alpha = variant === 'system' ? 0.8 : 0.6
    if (isWinElectron) {
      alpha = 1
    }

    return 'background:' + $readable.addTransparencyToGradient(g, alpha)
  })

  const barTheme = computed(() => {
    if (color.value) {
      return $readable.checkColorForDarkText(color.value) ? 'dark' : 'light'
    }
    return 'dark'
  })

  return {
    color,
    colorRGBA,
    gradient,
    barTheme,
    isWinElectron,
  }
}
