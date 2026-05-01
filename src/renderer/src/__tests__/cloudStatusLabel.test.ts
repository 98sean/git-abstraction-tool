import { describe, expect, it } from 'vitest'
import { getCloudStatusLabel } from '../hooks/useCloudSetup'

const terms = {
  privateBackupReadyLabel: 'Private backup ready',
  cloudBackupNotSetUpLabel: 'Cloud backup not set up yet',
  teamUploadReviewBranchStatus: (remoteName: string, branchName: string) =>
    `Team upload: review branch ${branchName} on ${remoteName}. main is not updated.`,
  teamUploadExistingBranchStatus: (remoteName: string, branchName: string) =>
    `Team upload: existing branch ${branchName} on ${remoteName}.`,
  teamUploadDefaultBranchStatus: (remoteName: string, branchName: string) =>
    `Team upload: default branch ${branchName} on ${remoteName}.`,
  teamUploadReadyLabel: 'Team upload ready'
}

describe('cloud upload status label', () => {
  it('explains that new-branch team upload does not push directly to main', () => {
    expect(
      getCloudStatusLabel(
        {
          mode: 'collaboration',
          backup: null,
          collaboration: {
            remoteName: 'origin',
            branchMode: 'new_branch',
            selectedBranch: 'gat/demo-update'
          }
        },
        terms
      )
    ).toBe('Team upload: review branch gat/demo-update on origin. main is not updated.')
  })
})
