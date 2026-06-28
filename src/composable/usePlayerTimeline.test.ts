import {describe, it, expect} from 'vitest'
import {findMarkToJump, getMarkStatusLabel} from '@/composable/usePlayerTimeline'
import type { PlayerMark } from '@/types/player'

describe('usePlayerTimeline helpers', () => {
  const marks: PlayerMark[] = [
    {id: 1, time: 10, name: 'A', type: 'favorite'},
    {id: 2, time: 30, name: 'B', type: 'favorite'},
    {id: 3, time: 50, name: 'C', type: 'favorite'},
  ]

  it('finds previous mark before current time', () => {
    expect(findMarkToJump(marks, 35, 'prev')).toEqual(marks[0])
    expect(findMarkToJump(marks, 41, 'prev')).toEqual(marks[1])
    expect(findMarkToJump(marks, 12, 'prev')).toBeNull()
  })

  it('finds next mark after current time', () => {
    expect(findMarkToJump(marks, 12, 'next')).toEqual(marks[1])
    expect(findMarkToJump(marks, 35, 'next')).toEqual(marks[2])
  })

  it('returns null when no mark matches', () => {
    expect(findMarkToJump(marks, 4, 'prev')).toBeNull()
    expect(findMarkToJump(marks, 60, 'next')).toBeNull()
  })

  it('builds mark status label', () => {
    expect(getMarkStatusLabel({type: 'meta', time: 0, 'tag.name': 'Tag A'})).toBe('Tag A')
    expect(getMarkStatusLabel({type: 'favorite', time: 0, name: 'Intro'})).toBe('Intro')
    expect(getMarkStatusLabel(null)).toBe('')
  })
})
