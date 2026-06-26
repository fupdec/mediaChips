import {describe, it, expect} from 'vitest'
import {
  checkColorForDarkText,
  getReadableDuration,
  getReadableFileSize,
  getTextColor,
  getHoverPreviewDimensions,
} from '@/services/formatUtils'

describe('formatUtils', () => {
  it('formats duration as hh:mm:ss', () => {
    expect(getReadableDuration(65)).toBe('01:05')
    expect(getReadableDuration(3661)).toBe('01:01:01')
  })

  it('formats file sizes', () => {
    expect(getReadableFileSize(500)).toBe('500 B')
    expect(getReadableFileSize(2048)).toMatch(/KB/)
  })

  it('detects dark text on dark backgrounds', () => {
    expect(checkColorForDarkText('#000000')).toBe(true)
    expect(checkColorForDarkText('#ffffff')).toBe(false)
    expect(getTextColor('#000000')).toBe('white')
  })

  it('calculates hover preview dimensions', () => {
    expect(getHoverPreviewDimensions(1920, 1080)).toEqual({
      previewWidth: 180,
      previewHeight: 101,
    })
  })
})
