export type AppLanguage = 'en' | 'ko'
export type TerminologyMode = 'newbie' | 'pro'

export interface AppTerms {
  sidebarTitle: string
  addRepo: string
  noReposHint: string

  stageAll: string
  unstageAll: string
  stagedOf: (staged: number, total: number) => string
  loadingStatus: string
  cleanTitle: string
  cleanSubtext: string

  revertBtn: string
  revertTitle: string

  commitPlaceholder: (hasStaged: boolean) => string
  commitBtn: (count: number) => string
  committingBtn: string
  pushBtn: string
  pullBtn: string
  pushTitle: string
  pullTitle: string

  filesStaged: (n: number) => string
  toPush: (n: number) => string
  toPull: (n: number) => string
  conflictMsg: string

  branchLabel: string
  newBranchBtn: string
  mergeBranchBtn: string
  deleteBranchBtn: string
  mergeBranchConfirm: (source: string, target: string) => string
  mergeDefaultBranchConfirm: (source: string, target: string) => string
  deleteBranchConfirm: (name: string) => string
  deleteCurrentBranchConfirm: (name: string, fallback: string) => string
  protectedBranchMsg: (name: string) => string
  branchPlaceholder: string
  switchedBranchToast: (name: string) => string
  createdBranchToast: (name: string) => string
  mergedBranchToast: (source: string, target: string) => string
  deletedBranchToast: (name: string) => string

  initRepoBtn: string
  notARepoTitle: string
  notARepoDesc: string

  committedToast: string
  pushedToast: string
  pulledToast: string
  repoAdded: (name: string) => string
  repoAddFailed: string
  repoRemoved: string
  repoOpenFailed: string
}

const EN_PRO: AppTerms = {
  sidebarTitle: 'Repositories',
  addRepo: '+ Add Repository',
  noReposHint: 'No repositories yet.\nClick "Add Repository" to get started.',

  stageAll: 'Stage all',
  unstageAll: 'Unstage all',
  stagedOf: (s, t) => `${s} / ${t} staged`,
  loadingStatus: 'Loading status...',
  cleanTitle: 'Working tree clean',
  cleanSubtext: 'Nothing to commit',

  revertBtn: 'Revert',
  revertTitle: 'Revert changes to this file',

  commitPlaceholder: (hasStaged) => (hasStaged ? 'Commit message...' : 'Stage changes above to commit'),
  commitBtn: (n) => `Commit${n > 0 ? ` (${n})` : ''}`,
  committingBtn: 'Committing...',
  pushBtn: 'Push',
  pullBtn: 'Pull',
  pushTitle: 'Push commits to remote',
  pullTitle: 'Pull from remote',

  filesStaged: (n) => `${n} file${n !== 1 ? 's' : ''} staged`,
  toPush: (n) => `${n} to push`,
  toPull: (n) => `${n} to pull`,
  conflictMsg: 'Merge conflict detected',

  branchLabel: 'Branch',
  newBranchBtn: '+ New Branch',
  mergeBranchBtn: 'Merge',
  deleteBranchBtn: 'Delete',
  mergeBranchConfirm: (source, target) =>
    `Merge "${source}" into "${target}"?\n\n"${target}" will include changes from "${source}".`,
  mergeDefaultBranchConfirm: (source, target) =>
    `Final check\n\nYou're merging "${source}" into "${target}" (default branch).\nContinue?`,
  deleteBranchConfirm: (name) => `Delete branch "${name}"?`,
  deleteCurrentBranchConfirm: (name, fallback) =>
    `Delete current branch "${name}"?\n\nYou are currently on "${name}", so the app will switch to "${fallback}" first and then delete "${name}".\nProceed?`,
  protectedBranchMsg: (name) => `The "${name}" branch is protected and cannot be deleted.`,
  branchPlaceholder: 'branch-name',
  switchedBranchToast: (name) => `Switched to branch "${name}"`,
  createdBranchToast: (name) => `Created and switched to "${name}"`,
  mergedBranchToast: (source, target) => `Merged "${source}" into "${target}"`,
  deletedBranchToast: (name) => `Deleted branch "${name}"`,

  initRepoBtn: 'Initialize Repository',
  notARepoTitle: 'Not a Git repository',
  notARepoDesc: 'This folder has not been initialized as a Git repository yet.',

  committedToast: 'Committed successfully!',
  pushedToast: 'Pushed successfully',
  pulledToast: 'Pulled successfully',
  repoAdded: (name) => `"${name}" added successfully`,
  repoAddFailed: 'Could not open that repository. Please try again.',
  repoRemoved: 'Repository removed',
  repoOpenFailed: 'Could not open that repository. Please try again.'
}

const EN_NEWBIE: AppTerms = {
  sidebarTitle: 'My Projects',
  addRepo: '+ Link a Project',
  noReposHint: 'No projects yet.\nClick "Link a Project" to get started.',

  stageAll: 'Select all',
  unstageAll: 'Deselect all',
  stagedOf: (s, t) => `${s} / ${t} selected`,
  loadingStatus: 'Checking for changes...',
  cleanTitle: 'Everything is saved',
  cleanSubtext: 'No unsaved changes',

  revertBtn: 'Undo',
  revertTitle: 'Undo changes to this file',

  commitPlaceholder: (hasStaged) => (hasStaged ? 'Describe your changes...' : 'Select changes above to save'),
  commitBtn: (n) => `Save Progress${n > 0 ? ` (${n})` : ''}`,
  committingBtn: 'Saving...',
  pushBtn: 'Upload',
  pullBtn: 'Get Updates',
  pushTitle: 'Upload your saved versions to cloud',
  pullTitle: 'Get latest updates from cloud',

  filesStaged: (n) => `${n} change${n !== 1 ? 's' : ''} selected`,
  toPush: (n) => `${n} to upload`,
  toPull: (n) => `${n} to download`,
  conflictMsg: 'Version mismatch detected',

  branchLabel: 'Version',
  newBranchBtn: '+ New Version',
  mergeBranchBtn: 'Merge',
  deleteBranchBtn: 'Delete',
  mergeBranchConfirm: (source, target) =>
    `Merge version "${source}" into "${target}"?\n\n"${target}" will get changes from "${source}".`,
  mergeDefaultBranchConfirm: (source, target) =>
    `Final check\n\nYou're merging "${source}" into "${target}" (default version).\nContinue?`,
  deleteBranchConfirm: (name) => `Delete version "${name}"?`,
  deleteCurrentBranchConfirm: (name, fallback) =>
    `Delete current version "${name}"?\n\nYou are currently on "${name}", so the app will switch to "${fallback}" first and then delete "${name}".\nProceed?`,
  protectedBranchMsg: (name) => `"${name}" is protected and cannot be deleted.`,
  branchPlaceholder: 'version-name',
  switchedBranchToast: (name) => `Switched to version "${name}"`,
  createdBranchToast: (name) => `Created and switched to "${name}"`,
  mergedBranchToast: (source, target) => `Merged "${source}" into "${target}"`,
  deletedBranchToast: (name) => `Deleted version "${name}"`,

  initRepoBtn: 'Set up this Project',
  notARepoTitle: 'Project not set up yet',
  notARepoDesc: 'This folder has not been set up for saving and tracking changes yet.',

  committedToast: 'Saved successfully!',
  pushedToast: 'Uploaded to cloud',
  pulledToast: 'Updates downloaded',
  repoAdded: (name) => `"${name}" linked successfully`,
  repoAddFailed: 'Could not link that folder. Please try again.',
  repoRemoved: 'Project removed',
  repoOpenFailed: 'Could not link that folder. Please try again.'
}

const KO_NEWBIE: AppTerms = {
  sidebarTitle: '내 프로젝트',
  addRepo: '+ 프로젝트 연결',
  noReposHint: '아직 프로젝트가 없습니다.\n"프로젝트 연결"을 눌러 시작하세요.',

  stageAll: '모두 선택',
  unstageAll: '모두 선택 해제',
  stagedOf: (s, t) => `${s} / ${t} 선택됨`,
  loadingStatus: '변경사항 확인 중...',
  cleanTitle: '모든 내용이 저장됨',
  cleanSubtext: '저장할 변경사항이 없습니다',

  revertBtn: '되돌리기',
  revertTitle: '이 파일의 변경사항 되돌리기',

  commitPlaceholder: (hasStaged) => (hasStaged ? '변경 내용을 설명하세요...' : '저장할 변경사항을 먼저 선택하세요'),
  commitBtn: (n) => `진행 상황 저장${n > 0 ? ` (${n})` : ''}`,
  committingBtn: '저장 중...',
  pushBtn: '올리기',
  pullBtn: '업데이트 받기',
  pushTitle: '저장한 버전을 클라우드에 올리기',
  pullTitle: '클라우드에서 최신 업데이트 받기',

  filesStaged: (n) => `${n}개 변경사항 선택됨`,
  toPush: (n) => `${n}개 올릴 항목`,
  toPull: (n) => `${n}개 받을 항목`,
  conflictMsg: '버전 충돌이 감지됨',

  branchLabel: '버전',
  newBranchBtn: '+ 새 버전',
  mergeBranchBtn: '합치기',
  deleteBranchBtn: '삭제',
  mergeBranchConfirm: (source, target) =>
    `"${source}" 버전을 "${target}"에 합칠까요?\n\n"${target}"에 "${source}"의 변경사항이 들어갑니다.`,
  mergeDefaultBranchConfirm: (source, target) =>
    `마지막 확인\n\n"${source}"를 기본 버전 "${target}"에 합치려고 합니다.\n계속할까요?`,
  deleteBranchConfirm: (name) => `"${name}" 버전을 삭제할까요?`,
  deleteCurrentBranchConfirm: (name, fallback) =>
    `현재 버전 "${name}"을 삭제할까요?\n\n지금 "${name}"을 사용 중이므로 앱이 먼저 "${fallback}"으로 이동한 뒤 "${name}"을 삭제합니다.\n진행할까요?`,
  protectedBranchMsg: (name) => `"${name}"은 보호되어 삭제할 수 없습니다.`,
  branchPlaceholder: 'version-name',
  switchedBranchToast: (name) => `"${name}" 버전으로 이동했습니다`,
  createdBranchToast: (name) => `"${name}" 버전을 만들고 이동했습니다`,
  mergedBranchToast: (source, target) => `"${source}"를 "${target}"에 합쳤습니다`,
  deletedBranchToast: (name) => `"${name}" 버전을 삭제했습니다`,

  initRepoBtn: '프로젝트 설정',
  notARepoTitle: '아직 설정되지 않은 프로젝트',
  notARepoDesc: '이 폴더는 아직 변경사항 저장과 추적을 위해 설정되지 않았습니다.',

  committedToast: '저장했습니다!',
  pushedToast: '클라우드에 올렸습니다',
  pulledToast: '업데이트를 받았습니다',
  repoAdded: (name) => `"${name}" 프로젝트가 연결되었습니다`,
  repoAddFailed: '이 폴더를 연결할 수 없습니다. 다시 시도하세요.',
  repoRemoved: '프로젝트를 제거했습니다',
  repoOpenFailed: '이 폴더를 연결할 수 없습니다. 다시 시도하세요.'
}

const KO_PRO: AppTerms = {
  sidebarTitle: '저장소',
  addRepo: '+ 저장소 추가',
  noReposHint: '아직 저장소가 없습니다.\n"저장소 추가"를 눌러 시작하세요.',

  stageAll: '모두 스테이지',
  unstageAll: '모두 언스테이지',
  stagedOf: (s, t) => `${s} / ${t} 스테이지됨`,
  loadingStatus: '상태 불러오는 중...',
  cleanTitle: '작업 트리 깨끗함',
  cleanSubtext: '커밋할 변경사항 없음',

  revertBtn: '되돌리기',
  revertTitle: '이 파일 변경사항 되돌리기',

  commitPlaceholder: (hasStaged) => (hasStaged ? '커밋 메시지...' : '커밋할 변경사항을 스테이지하세요'),
  commitBtn: (n) => `커밋${n > 0 ? ` (${n})` : ''}`,
  committingBtn: '커밋 중...',
  pushBtn: '푸시',
  pullBtn: '풀',
  pushTitle: '커밋을 remote에 푸시',
  pullTitle: 'remote에서 풀',

  filesStaged: (n) => `${n}개 파일 스테이지됨`,
  toPush: (n) => `${n}개 푸시 필요`,
  toPull: (n) => `${n}개 풀 필요`,
  conflictMsg: '머지 충돌 감지됨',

  branchLabel: '브랜치',
  newBranchBtn: '+ 새 브랜치',
  mergeBranchBtn: '머지',
  deleteBranchBtn: '삭제',
  mergeBranchConfirm: (source, target) =>
    `"${source}"를 "${target}"에 머지할까요?\n\n"${target}"에 "${source}"의 변경사항이 포함됩니다.`,
  mergeDefaultBranchConfirm: (source, target) =>
    `마지막 확인\n\n"${source}"를 기본 브랜치 "${target}"에 머지하려고 합니다.\n계속할까요?`,
  deleteBranchConfirm: (name) => `"${name}" 브랜치를 삭제할까요?`,
  deleteCurrentBranchConfirm: (name, fallback) =>
    `현재 브랜치 "${name}"을 삭제할까요?\n\n지금 "${name}"에 있으므로 앱이 먼저 "${fallback}"으로 전환한 뒤 "${name}"을 삭제합니다.\n진행할까요?`,
  protectedBranchMsg: (name) => `"${name}" 브랜치는 보호되어 삭제할 수 없습니다.`,
  branchPlaceholder: 'branch-name',
  switchedBranchToast: (name) => `"${name}" 브랜치로 전환했습니다`,
  createdBranchToast: (name) => `"${name}" 브랜치를 만들고 전환했습니다`,
  mergedBranchToast: (source, target) => `"${source}"를 "${target}"에 머지했습니다`,
  deletedBranchToast: (name) => `"${name}" 브랜치를 삭제했습니다`,

  initRepoBtn: '저장소 초기화',
  notARepoTitle: 'Git 저장소가 아님',
  notARepoDesc: '이 폴더는 아직 Git 저장소로 초기화되지 않았습니다.',

  committedToast: '커밋했습니다!',
  pushedToast: '푸시했습니다',
  pulledToast: '풀 완료',
  repoAdded: (name) => `"${name}" 저장소가 추가되었습니다`,
  repoAddFailed: '이 저장소를 열 수 없습니다. 다시 시도하세요.',
  repoRemoved: '저장소를 제거했습니다',
  repoOpenFailed: '이 저장소를 열 수 없습니다. 다시 시도하세요.'
}

const TERM_DICTIONARY: Record<AppLanguage, Record<TerminologyMode, AppTerms>> = {
  en: {
    newbie: EN_NEWBIE,
    pro: EN_PRO
  },
  ko: {
    newbie: KO_NEWBIE,
    pro: KO_PRO
  }
}

export function getTerms(language: AppLanguage, mode: TerminologyMode): AppTerms {
  return TERM_DICTIONARY[language]?.[mode] ?? TERM_DICTIONARY.en.pro
}
