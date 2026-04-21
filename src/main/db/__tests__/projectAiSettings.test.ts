import { afterEach, describe, expect, it } from 'vitest'
import {
  clearProjectAiSettings,
  getProjectAiSettings,
  setProjectAiSettings
} from '../projectAiSettings'

describe('project AI settings', () => {
  afterEach(() => {
    clearProjectAiSettings('p1')
  })

  it('defaults a project to disabled and unconsented', () => {
    expect(getProjectAiSettings('p1')).toEqual({
      auto_save_message_enabled: false,
      ai_diff_consent_granted: false,
      ai_diff_consent_granted_at: null
    })
  })

  it('stores settings per project id', () => {
    setProjectAiSettings('p1', {
      auto_save_message_enabled: true,
      ai_diff_consent_granted: true,
      ai_diff_consent_granted_at: 123
    })

    expect(getProjectAiSettings('p1')).toEqual({
      auto_save_message_enabled: true,
      ai_diff_consent_granted: true,
      ai_diff_consent_granted_at: 123
    })
  })
})
