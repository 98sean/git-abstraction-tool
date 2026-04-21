import { afterEach, describe, expect, it } from 'vitest'
import {
  clearProjectCloudTarget,
  getProjectCloudTarget,
  setProjectCloudTarget
} from '../projectCloudTargets'

describe('projectCloudTargets', () => {
  afterEach(() => {
    clearProjectCloudTarget('p1')
  })

  it('defaults to no upload target', () => {
    expect(getProjectCloudTarget('p1')).toEqual({
      mode: 'none',
      backup: null,
      collaboration: null
    })
  })

  it('stores configured upload metadata', () => {
    setProjectCloudTarget('p1', {
      mode: 'backup',
      backup: {
        remoteName: 'backup-origin',
        repoOwner: 'tony',
        repoName: 'demo',
        private: true
      },
      collaboration: null
    })

    expect(getProjectCloudTarget('p1').mode).toBe('backup')
  })
})
