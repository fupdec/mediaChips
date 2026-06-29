import { describe, expect, it } from 'vitest'
import {
  parsePageSettingsFindOrCreate,
  parsePageSettingsRecord,
  parsePlaylistCreateResponse,
} from '@shared/schemas'

describe('page schemas', () => {
  it('parses page settings record', () => {
    const record = parsePageSettingsRecord({
      page: 2,
      limit: 50,
      sortBy: 'name',
    })
    expect(record.page).toBe(2)
    expect(record.limit).toBe(50)
  })

  it('parses find-or-create tuple', () => {
    const tuple = parsePageSettingsFindOrCreate([
      { page: 1, limit: 24 },
      true,
    ])
    expect(tuple[0]?.page).toBe(1)
    expect(tuple[1]).toBe(true)
  })

  it('parses playlist create response', () => {
    const playlist = parsePlaylistCreateResponse({ id: 5, name: 'Favorites' })
    expect(playlist.id).toBe(5)
    expect(playlist.name).toBe('Favorites')
  })
})
