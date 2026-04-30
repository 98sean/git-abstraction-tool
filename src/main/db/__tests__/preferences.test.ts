import { describe, expect, it } from 'vitest'
import { getPreferences } from '../preferences'

describe('preferences store', () => {
  it('defaults to English language and pro terminology', () => {
    const preferences = getPreferences()

    expect(preferences.language).toBe('en')
    expect(preferences.mode).toBe('pro')
  })
})
