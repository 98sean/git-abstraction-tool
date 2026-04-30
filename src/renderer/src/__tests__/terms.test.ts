import { describe, expect, it } from 'vitest'
import { getTerms } from '../i18n/terms'

describe('getTerms', () => {
  it('keeps English newbie and pro terminology separate', () => {
    expect(getTerms('en', 'newbie').commitBtn(1)).toContain('Save Progress')
    expect(getTerms('en', 'pro').commitBtn(1)).toContain('Commit')
  })

  it('keeps Korean newbie and pro terminology separate', () => {
    expect(getTerms('ko', 'newbie').commitBtn(1)).toContain('진행 상황 저장')
    expect(getTerms('ko', 'pro').commitBtn(1)).toContain('커밋')
  })
})
