import {describe, it, expect} from 'vitest'
import {detectAppPlatform} from '@/composable/useAppPlatform'

describe('detectAppPlatform', () => {
  it('detects electron on windows', () => {
    const ua = 'mozilla/5.0 (windows nt 10.0; win64; x64) applewebkit/537.36 electron/28.0.0'
    expect(detectAppPlatform(ua)).toEqual({
      isElectron: true,
      isMac: false,
      isWin: true,
    })
  })

  it('detects browser on mac', () => {
    const ua = 'mozilla/5.0 (macintosh; intel mac os x 10_15_7) applewebkit/537.36 chrome/120.0.0.0'
    expect(detectAppPlatform(ua)).toEqual({
      isElectron: false,
      isMac: true,
      isWin: false,
    })
  })
})
