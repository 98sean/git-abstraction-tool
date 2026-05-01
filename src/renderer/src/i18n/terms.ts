export type AppLanguage = 'en' | 'ko'
export type TerminologyMode = 'newbie' | 'pro'
export type FileStatusTerm = 'clean' | 'new' | 'modified' | 'deleted' | 'renamed' | 'conflicted' | 'untracked'
export type ProjectWarningKind = 'large' | 'binary' | 'sensitive' | 'generated'

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
  fileStatusLabel: (status: FileStatusTerm) => string
  selectProjectFilesText: string
  collapseAllBtn: string
  expandAllBtn: string
  hiddenDepChangesBtn: (count: number) => string
  hideDependencyTitle: string
  showDependencyTitle: string
  hideDepsBtn: string
  showDepsBtn: string
  reviewUntrackedBtn: (count: number) => string
  reviewingUntrackedBtn: string
  stageFileLabel: (path: string) => string
  unstageFileLabel: (path: string) => string
  untrackedReviewDialogLabel: string
  untrackedReviewTitle: string
  untrackedReviewCloseLabel: string
  untrackedReviewLoading: string
  untrackedReviewSummary: (total: number, commit: number, deleteCount: number) => string
  deleteThisFileLabel: string
  stageRecommendedFilesBtn: string
  deletingBtn: string
  deleteSelectedBtn: (count: number) => string

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
  weeklyReportBtn: string
  modeToggleBtn: (nextMode: TerminologyMode) => string
  languageToggleBtn: (nextLanguage: AppLanguage) => string
  settingsBtn: string
  themeToggleBtn: (nextTheme: 'light' | 'dark') => string
  dismissErrorLabel: string
  authFailedConnectLabel: string
  aiSuggestBtn: string
  aiSuggestTitle: string
  aiDraftReady: string
  aiDraftFailed: string
  draftingBtn: string
  thinkingBtn: string
  uploadedBranch: (branchName: string) => string
  openPullRequest: string
  naturalUndoTitle: string
  aiConnectionRequired: string
  cancelNaturalUndoLabel: string
  naturalUndoPlaceholder: string
  naturalUndoAnalyzingBtn: string
  naturalUndoFindBtn: string
  confidenceLabel: (percent: string) => string
  restoreFiles: (count: number) => string
  removeFiles: (count: number) => string
  restoreFilePrefix: string
  removeFilePrefix: string
  restoringBtn: string
  restorePointBtn: string
  alternativeMatchesLabel: string
  projectSettingsTitle: string
  projectSettingsDescription: string
  closeProjectSettingsLabel: string
  closeAiConnectionLabel: string
  closeWeeklyReportLabel: string
  closeGitHubPanelLabel: string
  gitHubConnectedLabel: string
  gitHubConnectedDescription: string
  disconnectGitHubBtn: string
  modeLabelNewbie: string
  modeLabelPro: string
  themeLabelLight: string
  themeLabelDark: string
  aiSaveMessagesTitle: string
  useAiAutoSaveMessagesLabel: string
  aiConnectionLabel: string
  aiConnectedLabel: string
  aiConnectedDescription: string
  aiConnectProviderFirstLabel: string
  modelLabel: string
  noneSelectedLabel: string
  diffConsentLabel: string
  diffConsentGrantedLabel: string
  diffConsentNotGrantedLabel: string
  openConnectAiBtn: string
  cloudUploadTitle: string
  statusLabel: string
  privateBackupReadyLabel: string
  teamUploadReadyLabel: string
  cloudBackupNotSetUpLabel: string
  defaultBranchLabel: string
  protectedBranchSuffix: string
  notDetectedYetLabel: string
  repositoryLabel: string
  remoteLabel: string
  notChosenLabel: string
  setupCloudUploadBtn: string
  changeUploadTargetBtn: string
  connectAiTitle: string
  connectAiDescription: string
  disconnectAiBtn: string
  cancelBtn: string
  providerLabel: string
  apiKeyLabel: string
  connectingAiBtn: string
  connectAiBtn: string
  viewProviderDocsBtn: string
  connectedToProviderLabel: (provider: string) => string
  aiConnectionLoadFailedToast: string
  aiConnectedToast: string
  aiKeyValidationFailedToast: string
  aiDisconnectedToast: string
  manageAiConnectionTitle: string
  connectAiProviderTitle: string
  weeklySummaryTitle: string
  weeklySummaryGenerating: string
  weeklySummaryConnectAiHint: string
  weeklySummaryNoCommits: string
  weeklySummaryBasedOn: (commitCount: number, aiSummaryCount: number, activeDays: number) => string
  weeklySelectProjectText: string
  weeklyLoadingText: string
  weeklyTextFallback: (filesAdded: number, filesModified: number, filesDeleted: number, subjects: string[]) => string
  weeklyTotalCommitsLabel: string
  weeklyNewFilesLabel: string
  weeklyModifiedFilesLabel: string
  weeklyDeletedFilesLabel: string
  weeklyLinesAddedLabel: string
  weeklyLinesDeletedLabel: string
  weeklyDailyActivityTitle: string
  weeklyCommitHistoryTitle: string
  weeklyNoCommitsThisWeek: string
  weeklyInitialImportLabel: string
  weeklyInitialImportTitle: string
  weeklyCommitFileCount: (count: number) => string
  weeklyFileStatusLabel: (status: string) => string
  weeklyPrevWeekLabel: string
  weeklyNextWeekLabel: string
  weeklyCurrentWeekLabel: string
  linkProjectEyebrow: string
  linkChooseTitle: string
  linkPrepareTitle: string
  linkWarningsTitle: string
  linkReviewTitle: string
  linkCloseLabel: string
  linkSelectedFolderLabel: string
  linkChooseCopy: string
  linkCheckingFolderBtn: string
  linkChooseFolderBtn: string
  linkPrepareCopy: string
  linkApproveInitBtn: string
  linkWarningsCopy: string
  linkExcludeLabel: string
  linkRecommendedExcludesLabel: string
  linkWarningReason: (kind: ProjectWarningKind, reason: string) => string
  linkFinishBtn: string
  linkReviewCopy: string
  linkDetectedRemotesLabel: string
  linkLinkingBtn: string
  fileInsightTitle: string
  fileInsightConnectAiHint: string
  fileInsightSelectFileHint: string
  fileInsightAnalyzingBtn: string
  fileInsightRefreshBtn: string
  fileInsightAnalyzingText: string
  fileInsightSummaryTitle: string
  fileInsightFunctionalityTitle: string
  fileInsightRelatedFilesTitle: string
  fileInsightNoRelatedFiles: string
}

const EN_PRO_STATUS: Record<FileStatusTerm, string> = {
  clean: 'Synced',
  new: 'New',
  modified: 'Modified',
  deleted: 'Deleted',
  renamed: 'Renamed',
  conflicted: 'Conflict',
  untracked: 'Untracked'
}

const EN_NEWBIE_STATUS: Record<FileStatusTerm, string> = {
  clean: 'Saved',
  new: 'New',
  modified: 'Changed',
  deleted: 'Deleted',
  renamed: 'Renamed',
  conflicted: 'Needs review',
  untracked: 'Not selected yet'
}

const KO_NEWBIE_STATUS: Record<FileStatusTerm, string> = {
  clean: '저장됨',
  new: '새 파일',
  modified: '변경됨',
  deleted: '삭제됨',
  renamed: '이름 변경됨',
  conflicted: '확인 필요',
  untracked: '아직 선택 안 됨'
}

const KO_PRO_STATUS: Record<FileStatusTerm, string> = {
  clean: '동기화됨',
  new: '신규',
  modified: '수정됨',
  deleted: '삭제됨',
  renamed: '이름 변경',
  conflicted: '충돌',
  untracked: '언트래킹'
}

function formatEnglishWeeklyFallback(
  filesAdded: number,
  filesModified: number,
  filesDeleted: number,
  subjects: string[]
): string {
  const parts: string[] = []
  if (filesAdded > 0) parts.push(`${filesAdded} file(s) added`)
  if (filesModified > 0) parts.push(`${filesModified} file(s) modified`)
  if (filesDeleted > 0) parts.push(`${filesDeleted} file(s) deleted`)

  const statLine =
    parts.length > 0
      ? `This week, ${parts.join(', ')}.`
      : 'No file changes this week.'
  const workLine = subjects.length > 0 ? `Key work: ${subjects.join(' and ')}.` : ''

  return workLine ? `${statLine} ${workLine}` : statLine
}

function formatKoreanWeeklyFallback(
  filesAdded: number,
  filesModified: number,
  filesDeleted: number,
  subjects: string[]
): string {
  const parts: string[] = []
  if (filesAdded > 0) parts.push(`새 파일 ${filesAdded}개`)
  if (filesModified > 0) parts.push(`수정 파일 ${filesModified}개`)
  if (filesDeleted > 0) parts.push(`삭제 파일 ${filesDeleted}개`)

  const statLine =
    parts.length > 0
      ? `이번 주에는 ${parts.join(', ')}가 있었습니다.`
      : '이번 주에는 파일 변경이 없습니다.'
  const workLine = subjects.length > 0 ? `주요 작업: ${subjects.join(', ')}.` : ''

  return workLine ? `${statLine} ${workLine}` : statLine
}

function formatKoreanLinkWarning(kind: ProjectWarningKind, reason: string): string {
  if (kind === 'sensitive') return '민감한 파일에는 비밀값이나 인증 정보가 들어 있을 수 있습니다.'
  if (kind === 'large') return '큰 파일은 저장 기록과 업로드를 무겁게 만들 수 있습니다.'
  if (kind === 'binary') return '바이너리 파일은 검토하거나 합치기 어렵습니다.'
  if (kind === 'generated' && reason.toLowerCase().includes('folder')) {
    return '생성된 폴더는 보통 저장 기록에 포함하지 않는 편이 좋습니다.'
  }
  if (kind === 'generated') return '생성된 파일은 보통 저장 기록에 포함하지 않는 편이 좋습니다.'
  return reason
}

const EN_COMMON_APP_TERMS = {
  projectSettingsTitle: 'Project Settings',
  projectSettingsDescription: 'Review AI save-message options and cloud upload status for this project.',
  closeProjectSettingsLabel: 'Close project settings',
  closeAiConnectionLabel: 'Close AI connection panel',
  closeWeeklyReportLabel: 'Close weekly report',
  closeGitHubPanelLabel: 'Close GitHub panel',
  gitHubConnectedLabel: 'GitHub connected',
  gitHubConnectedDescription: 'Your account is linked to GitHub.',
  disconnectGitHubBtn: 'Disconnect GitHub',
  modeLabelNewbie: 'Newbie',
  modeLabelPro: 'Pro',
  themeLabelLight: 'Light',
  themeLabelDark: 'Dark',
  aiSaveMessagesTitle: 'AI Save Messages',
  useAiAutoSaveMessagesLabel: 'Use AI auto save messages',
  aiConnectionLabel: 'Connection',
  aiConnectedLabel: 'AI connected',
  aiConnectedDescription: 'Your AI provider is connected and ready.',
  aiConnectProviderFirstLabel: 'Connect a provider first',
  modelLabel: 'Model',
  noneSelectedLabel: 'None selected',
  diffConsentLabel: 'Diff consent',
  diffConsentGrantedLabel: 'Granted',
  diffConsentNotGrantedLabel: 'Not granted yet',
  openConnectAiBtn: 'Open Connect AI',
  cloudUploadTitle: 'Cloud Upload',
  statusLabel: 'Status',
  privateBackupReadyLabel: 'Private backup ready',
  teamUploadReadyLabel: 'Team upload ready',
  cloudBackupNotSetUpLabel: 'Cloud backup not set up yet',
  defaultBranchLabel: 'Default branch',
  protectedBranchSuffix: 'protected',
  notDetectedYetLabel: 'Not detected yet',
  repositoryLabel: 'Repository',
  remoteLabel: 'Remote',
  notChosenLabel: 'Not chosen',
  setupCloudUploadBtn: 'Set up cloud upload',
  changeUploadTargetBtn: 'Change upload target',
  connectAiTitle: 'Connect AI save suggestions',
  connectAiDescription:
    'Use your own OpenAI or Anthropic API key for optional save drafts, natural language undo, file insight, and untracked review.',
  disconnectAiBtn: 'Disconnect',
  cancelBtn: 'Cancel',
  providerLabel: 'Provider',
  apiKeyLabel: 'API key',
  connectingAiBtn: 'Connecting...',
  connectAiBtn: 'Connect AI',
  viewProviderDocsBtn: 'View provider docs',
  connectedToProviderLabel: (provider: string) => `Connected to ${provider}`,
  aiConnectionLoadFailedToast: 'Could not load AI connection status.',
  aiConnectedToast: 'AI connected successfully',
  aiKeyValidationFailedToast: 'Could not validate that AI key. Please try again.',
  aiDisconnectedToast: 'AI disconnected',
  manageAiConnectionTitle: 'Manage AI connection',
  connectAiProviderTitle: 'Connect an AI provider',
  weeklySummaryTitle: 'Weekly Summary',
  weeklySummaryGenerating: 'Generating AI summary...',
  weeklySummaryConnectAiHint: 'Connect AI to get a friendlier, feature-focused weekly summary.',
  weeklySummaryNoCommits: 'No commits were recorded this week yet.',
  weeklySummaryBasedOn: (commitCount: number, aiSummaryCount: number, activeDays: number) => {
    const pieces = [
      `Based on ${commitCount} commit${commitCount === 1 ? '' : 's'} this week`
    ]
    if (aiSummaryCount > 0) pieces.push(`${aiSummaryCount} with AI summaries`)
    if (activeDays > 0) pieces.push(`across ${activeDays} active day${activeDays === 1 ? '' : 's'}`)
    return pieces.join(' ')
  },
  weeklySelectProjectText: 'Select a project to view the weekly report.',
  weeklyLoadingText: 'Loading report...',
  weeklyTextFallback: formatEnglishWeeklyFallback,
  weeklyTotalCommitsLabel: 'Total Commits',
  weeklyNewFilesLabel: 'New Files',
  weeklyModifiedFilesLabel: 'Modified Files',
  weeklyDeletedFilesLabel: 'Deleted Files',
  weeklyLinesAddedLabel: 'Lines Added',
  weeklyLinesDeletedLabel: 'Lines Deleted',
  weeklyDailyActivityTitle: 'Daily Activity',
  weeklyCommitHistoryTitle: 'Commit History',
  weeklyNoCommitsThisWeek: 'No commits this week.',
  weeklyInitialImportLabel: 'Initial import',
  weeklyInitialImportTitle: "First commit of the repository. Its file counts are excluded from the week's totals.",
  weeklyCommitFileCount: (count: number) => `${count} file${count === 1 ? '' : 's'}`,
  weeklyFileStatusLabel: (status: string) => status,
  weeklyPrevWeekLabel: 'Prev Week',
  weeklyNextWeekLabel: 'Next Week',
  weeklyCurrentWeekLabel: 'This Week',
  linkProjectEyebrow: 'Link A Project',
  linkChooseTitle: 'Choose a project folder',
  linkPrepareTitle: 'Turn on change history',
  linkWarningsTitle: 'Review folder warnings',
  linkReviewTitle: 'Finish linking',
  linkCloseLabel: 'Close link wizard',
  linkSelectedFolderLabel: 'Selected folder',
  linkChooseCopy:
    'We will check whether this folder is ready for local save history before we link it.',
  linkCheckingFolderBtn: 'Checking folder...',
  linkChooseFolderBtn: 'Choose folder',
  linkPrepareCopy:
    'This folder is not using Git yet. Turning on change history keeps saves local and does not upload anything to GitHub.',
  linkApproveInitBtn: 'Turn it on and continue',
  linkWarningsCopy:
    'We found files that may be better excluded before the project starts saving history.',
  linkExcludeLabel: 'Exclude',
  linkRecommendedExcludesLabel: 'Recommended excludes',
  linkWarningReason: (_kind: ProjectWarningKind, reason: string) => reason,
  linkFinishBtn: 'Finish linking',
  linkReviewCopy:
    'This folder is ready. We will register it and start local file watching right away.',
  linkDetectedRemotesLabel: 'Detected remotes',
  linkLinkingBtn: 'Linking project...',
  fileInsightTitle: 'File Insight',
  fileInsightConnectAiHint: 'Connect AI to use file insight.',
  fileInsightSelectFileHint: 'Click a file to view what it does and related files.',
  fileInsightAnalyzingBtn: 'Analyzing...',
  fileInsightRefreshBtn: 'Refresh',
  fileInsightAnalyzingText: 'Analyzing file role and related files...',
  fileInsightSummaryTitle: 'Summary',
  fileInsightFunctionalityTitle: 'What This File Does',
  fileInsightRelatedFilesTitle: 'Related Files',
  fileInsightNoRelatedFiles: 'No related files found.'
}

const KO_COMMON_APP_TERMS = {
  projectSettingsTitle: '프로젝트 설정',
  projectSettingsDescription: '이 프로젝트의 AI 저장 메시지와 클라우드 업로드 상태를 확인합니다.',
  closeProjectSettingsLabel: '프로젝트 설정 닫기',
  closeAiConnectionLabel: 'AI 연결 패널 닫기',
  closeWeeklyReportLabel: '주간 리포트 닫기',
  closeGitHubPanelLabel: 'GitHub 패널 닫기',
  gitHubConnectedLabel: 'GitHub 연결됨',
  gitHubConnectedDescription: '계정이 GitHub에 연결되어 있습니다.',
  disconnectGitHubBtn: 'GitHub 연결 해제',
  modeLabelNewbie: '쉬운 말',
  modeLabelPro: '전문 용어',
  themeLabelLight: '밝게',
  themeLabelDark: '어둡게',
  aiSaveMessagesTitle: 'AI 저장 메시지',
  useAiAutoSaveMessagesLabel: 'AI 자동 저장 메시지 사용',
  aiConnectionLabel: 'AI 연결',
  aiConnectedLabel: 'AI 연결됨',
  aiConnectedDescription: 'AI provider가 연결되어 있습니다.',
  aiConnectProviderFirstLabel: 'AI provider를 먼저 연결하세요',
  modelLabel: '모델',
  noneSelectedLabel: '선택 안 됨',
  diffConsentLabel: 'diff 동의',
  diffConsentGrantedLabel: '허용됨',
  diffConsentNotGrantedLabel: '아직 허용 안 됨',
  openConnectAiBtn: 'AI 연결 열기',
  cloudUploadTitle: '클라우드 업로드',
  statusLabel: '상태',
  privateBackupReadyLabel: 'private 백업 준비됨',
  teamUploadReadyLabel: '팀 업로드 준비됨',
  cloudBackupNotSetUpLabel: '클라우드 백업 미설정',
  defaultBranchLabel: '기본 branch',
  protectedBranchSuffix: '보호됨',
  notDetectedYetLabel: '아직 감지 안 됨',
  repositoryLabel: '저장소',
  remoteLabel: 'remote',
  notChosenLabel: '선택 안 됨',
  setupCloudUploadBtn: '클라우드 업로드 설정',
  changeUploadTargetBtn: '업로드 대상 변경',
  connectAiTitle: 'AI 연결',
  connectAiDescription:
    '사용자 AI provider 키로 저장 초안, 자연어 되돌리기, 파일 설명, 새 파일 검토를 사용할 수 있습니다.',
  disconnectAiBtn: '연결 해제',
  cancelBtn: '취소',
  providerLabel: 'Provider',
  apiKeyLabel: 'API key',
  connectingAiBtn: '연결 중...',
  connectAiBtn: 'AI 연결',
  viewProviderDocsBtn: 'provider 문서 보기',
  connectedToProviderLabel: (provider: string) => `${provider}에 연결됨`,
  aiConnectionLoadFailedToast: 'AI 연결 상태를 불러오지 못했습니다.',
  aiConnectedToast: 'AI가 연결되었습니다.',
  aiKeyValidationFailedToast: 'AI key를 확인하지 못했습니다. 다시 시도하세요.',
  aiDisconnectedToast: 'AI 연결이 해제되었습니다.',
  manageAiConnectionTitle: 'AI 연결 관리',
  connectAiProviderTitle: 'AI provider 연결',
  weeklySummaryTitle: '주간 요약',
  weeklySummaryGenerating: 'AI 요약 생성 중...',
  weeklySummaryConnectAiHint: 'AI를 연결하면 더 친절한 기능 중심 주간 요약을 볼 수 있습니다.',
  weeklySummaryNoCommits: '이번 주에는 아직 저장 기록이 없습니다.',
  weeklySummaryBasedOn: (commitCount: number, aiSummaryCount: number, activeDays: number) =>
    `${commitCount}개 저장 기록 기준${aiSummaryCount > 0 ? `, AI 요약 ${aiSummaryCount}개` : ''}${activeDays > 0 ? `, 활동일 ${activeDays}일` : ''}`,
  weeklySelectProjectText: '주간 리포트를 보려면 프로젝트를 선택하세요.',
  weeklyLoadingText: '리포트 불러오는 중...',
  weeklyTextFallback: formatKoreanWeeklyFallback,
  weeklyTotalCommitsLabel: '총 저장',
  weeklyNewFilesLabel: '새 파일',
  weeklyModifiedFilesLabel: '수정 파일',
  weeklyDeletedFilesLabel: '삭제 파일',
  weeklyLinesAddedLabel: '추가된 줄',
  weeklyLinesDeletedLabel: '삭제된 줄',
  weeklyDailyActivityTitle: '일별 활동',
  weeklyCommitHistoryTitle: '저장 기록',
  weeklyNoCommitsThisWeek: '이번 주 저장 기록 없음',
  weeklyInitialImportLabel: '초기 가져오기',
  weeklyInitialImportTitle: '저장소의 첫 저장입니다. 파일 수는 주간 합계에서 제외됩니다.',
  weeklyCommitFileCount: (count: number) => `${count}개 파일`,
  weeklyFileStatusLabel: (status: string) => status,
  weeklyPrevWeekLabel: '이전 주',
  weeklyNextWeekLabel: '다음 주',
  weeklyCurrentWeekLabel: '이번 주',
  linkProjectEyebrow: '프로젝트 연결',
  linkChooseTitle: '프로젝트 폴더 선택',
  linkPrepareTitle: '변경 기록 켜기',
  linkWarningsTitle: '폴더 경고 확인',
  linkReviewTitle: '연결 마무리',
  linkCloseLabel: '연결 마법사 닫기',
  linkSelectedFolderLabel: '선택한 폴더',
  linkChooseCopy: '연결하기 전에 이 폴더가 로컬 저장 기록을 사용할 준비가 됐는지 확인합니다.',
  linkCheckingFolderBtn: '폴더 확인 중...',
  linkChooseFolderBtn: '폴더 선택',
  linkPrepareCopy:
    '이 폴더는 아직 Git을 사용하지 않습니다. 변경 기록을 켜도 저장은 로컬에 남고 GitHub에는 업로드되지 않습니다.',
  linkApproveInitBtn: '켜고 계속하기',
  linkWarningsCopy: '저장 기록을 시작하기 전에 제외하는 편이 좋은 파일을 찾았습니다.',
  linkExcludeLabel: '제외',
  linkRecommendedExcludesLabel: '추천 제외 항목',
  linkWarningReason: formatKoreanLinkWarning,
  linkFinishBtn: '연결 완료',
  linkReviewCopy: '이 폴더는 준비됐습니다. 등록 후 바로 로컬 파일 감시를 시작합니다.',
  linkDetectedRemotesLabel: '감지된 remote',
  linkLinkingBtn: '프로젝트 연결 중...',
  fileInsightTitle: '파일 설명',
  fileInsightConnectAiHint: '파일 설명을 사용하려면 AI를 연결하세요.',
  fileInsightSelectFileHint: '파일을 클릭하면 역할과 관련 파일을 볼 수 있습니다.',
  fileInsightAnalyzingBtn: '분석 중...',
  fileInsightRefreshBtn: '새로고침',
  fileInsightAnalyzingText: '파일 역할과 관련 파일 분석 중...',
  fileInsightSummaryTitle: '요약',
  fileInsightFunctionalityTitle: '이 파일이 하는 일',
  fileInsightRelatedFilesTitle: '관련 파일',
  fileInsightNoRelatedFiles: '관련 파일을 찾지 못했습니다.'
}

const EN_PRO: AppTerms = {
  ...EN_COMMON_APP_TERMS,
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
  fileStatusLabel: (status) => EN_PRO_STATUS[status],
  selectProjectFilesText: 'Select a repository to see its files',
  collapseAllBtn: 'Collapse all',
  expandAllBtn: 'Expand all',
  hiddenDepChangesBtn: (count) => `${count} in deps`,
  hideDependencyTitle: 'Hide dependency folders',
  showDependencyTitle: 'Show dependency folders (node_modules etc.)',
  hideDepsBtn: 'Hide deps',
  showDepsBtn: 'Show deps',
  reviewUntrackedBtn: (count) => `Review untracked (${count})`,
  reviewingUntrackedBtn: 'Reviewing...',
  stageFileLabel: (path) => `Stage ${path}`,
  unstageFileLabel: (path) => `Unstage ${path}`,
  untrackedReviewDialogLabel: 'Untracked review',
  untrackedReviewTitle: 'Untracked File Review',
  untrackedReviewCloseLabel: 'Close untracked review',
  untrackedReviewLoading: 'Analyzing untracked files...',
  untrackedReviewSummary: (total, commit, deleteCount) => `Total ${total} Commit ${commit} Delete ${deleteCount}`,
  deleteThisFileLabel: 'Delete this file',
  stageRecommendedFilesBtn: 'Stage recommended commit files',
  deletingBtn: 'Deleting...',
  deleteSelectedBtn: (count) => `Delete selected (${count})`,

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
  repoOpenFailed: 'Could not open that repository. Please try again.',
  weeklyReportBtn: 'Weekly Report',
  modeToggleBtn: (nextMode) => (nextMode === 'newbie' ? 'Switch to Newbie Mode' : 'Switch to Pro Mode'),
  languageToggleBtn: (nextLanguage) => (nextLanguage === 'ko' ? '한국어' : 'English'),
  settingsBtn: 'Settings',
  themeToggleBtn: (nextTheme) => (nextTheme === 'dark' ? 'Dark mode' : 'Light mode'),
  dismissErrorLabel: 'Dismiss error',
  authFailedConnectLabel: 'Connect GitHub →',
  aiSuggestBtn: 'AI Suggest',
  aiSuggestTitle: 'Use AI to suggest a save message',
  aiDraftReady: 'AI drafted a save message. Review it, then click Commit again.',
  aiDraftFailed: 'AI could not draft a save message. Enter one manually to continue.',
  draftingBtn: 'Drafting...',
  thinkingBtn: 'Thinking...',
  uploadedBranch: (branchName) => `Uploaded branch ${branchName}`,
  openPullRequest: 'Open pull request',
  naturalUndoTitle: 'Natural Language Undo',
  aiConnectionRequired: 'AI connection required',
  cancelNaturalUndoLabel: 'Cancel Natural Language Undo',
  naturalUndoPlaceholder: 'Example: "Restore to yesterday afternoon before the red button removal"',
  naturalUndoAnalyzingBtn: 'Analyzing...',
  naturalUndoFindBtn: 'Find Point',
  confidenceLabel: (percent) => `Confidence ${percent}%`,
  restoreFiles: (count) => `Restore ${count} files`,
  removeFiles: (count) => `Remove ${count} files`,
  restoreFilePrefix: 'Restore',
  removeFilePrefix: 'Remove',
  restoringBtn: 'Restoring...',
  restorePointBtn: 'Yes, Restore This Point',
  alternativeMatchesLabel: 'Not quite right? Other possible matches:'
}

const EN_NEWBIE: AppTerms = {
  ...EN_COMMON_APP_TERMS,
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
  fileStatusLabel: (status) => EN_NEWBIE_STATUS[status],
  selectProjectFilesText: 'Select a project to see its files',
  collapseAllBtn: 'Collapse all',
  expandAllBtn: 'Expand all',
  hiddenDepChangesBtn: (count) => `${count} hidden dependency changes`,
  hideDependencyTitle: 'Hide generated dependency folders',
  showDependencyTitle: 'Show generated dependency folders',
  hideDepsBtn: 'Hide deps',
  showDepsBtn: 'Show deps',
  reviewUntrackedBtn: (count) => `Review untracked (${count})`,
  reviewingUntrackedBtn: 'Reviewing...',
  stageFileLabel: (path) => `Select ${path}`,
  unstageFileLabel: (path) => `Deselect ${path}`,
  untrackedReviewDialogLabel: 'Untracked review',
  untrackedReviewTitle: 'Untracked File Review',
  untrackedReviewCloseLabel: 'Close untracked review',
  untrackedReviewLoading: 'Analyzing untracked files...',
  untrackedReviewSummary: (total, commit, deleteCount) => `Total ${total} Keep ${commit} Delete ${deleteCount}`,
  deleteThisFileLabel: 'Delete this file',
  stageRecommendedFilesBtn: 'Select recommended files',
  deletingBtn: 'Deleting...',
  deleteSelectedBtn: (count) => `Delete selected (${count})`,

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
  repoOpenFailed: 'Could not link that folder. Please try again.',
  weeklyReportBtn: 'Weekly Report',
  modeToggleBtn: (nextMode) => (nextMode === 'newbie' ? 'Switch to Newbie Mode' : 'Switch to Pro Mode'),
  languageToggleBtn: (nextLanguage) => (nextLanguage === 'ko' ? '한국어' : 'English'),
  settingsBtn: 'Settings',
  themeToggleBtn: (nextTheme) => (nextTheme === 'dark' ? 'Dark mode' : 'Light mode'),
  dismissErrorLabel: 'Dismiss error',
  authFailedConnectLabel: 'Connect GitHub →',
  aiSuggestBtn: 'AI Suggest',
  aiSuggestTitle: 'Use AI to suggest a save message',
  aiDraftReady: 'AI drafted a save message. Review it, then click Save Progress again.',
  aiDraftFailed: 'AI could not draft a save message. Enter one manually to continue.',
  draftingBtn: 'Drafting...',
  thinkingBtn: 'Thinking...',
  uploadedBranch: (branchName) => `Uploaded branch ${branchName}`,
  openPullRequest: 'Open pull request',
  naturalUndoTitle: 'Natural Language Undo',
  aiConnectionRequired: 'AI connection required',
  cancelNaturalUndoLabel: 'Cancel Natural Language Undo',
  naturalUndoPlaceholder: 'Example: "Restore to yesterday afternoon before the red button removal"',
  naturalUndoAnalyzingBtn: 'Analyzing...',
  naturalUndoFindBtn: 'Find Point',
  confidenceLabel: (percent) => `Confidence ${percent}%`,
  restoreFiles: (count) => `Restore ${count} files`,
  removeFiles: (count) => `Remove ${count} files`,
  restoreFilePrefix: 'Restore',
  removeFilePrefix: 'Remove',
  restoringBtn: 'Restoring...',
  restorePointBtn: 'Yes, Restore This Point',
  alternativeMatchesLabel: 'Not quite right? Other possible matches:'
}

const KO_NEWBIE: AppTerms = {
  ...KO_COMMON_APP_TERMS,
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
  fileStatusLabel: (status) => KO_NEWBIE_STATUS[status],
  selectProjectFilesText: '파일을 보려면 프로젝트를 선택하세요',
  collapseAllBtn: '모두 접기',
  expandAllBtn: '모두 펼치기',
  hiddenDepChangesBtn: (count) => `숨겨진 의존성 변경 ${count}개`,
  hideDependencyTitle: '생성된 의존성 폴더 숨기기',
  showDependencyTitle: '생성된 의존성 폴더 보기',
  hideDepsBtn: '의존성 숨김',
  showDepsBtn: '의존성 보기',
  reviewUntrackedBtn: (count) => `새 파일 검토 (${count})`,
  reviewingUntrackedBtn: '검토 중...',
  stageFileLabel: (path) => `${path} 선택`,
  unstageFileLabel: (path) => `${path} 선택 해제`,
  untrackedReviewDialogLabel: '새 파일 검토',
  untrackedReviewTitle: '새 파일 검토',
  untrackedReviewCloseLabel: '새 파일 검토 닫기',
  untrackedReviewLoading: '새 파일을 분석 중...',
  untrackedReviewSummary: (total, commit, deleteCount) => `전체 ${total}개 저장 후보 ${commit}개 삭제 후보 ${deleteCount}개`,
  deleteThisFileLabel: '이 파일 삭제',
  stageRecommendedFilesBtn: '추천 파일 선택',
  deletingBtn: '삭제 중...',
  deleteSelectedBtn: (count) => `선택 항목 삭제 (${count})`,

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
  repoOpenFailed: '이 폴더를 연결할 수 없습니다. 다시 시도하세요.',
  weeklyReportBtn: '주간 리포트',
  modeToggleBtn: (nextMode) => (nextMode === 'newbie' ? '쉬운 용어로 보기' : '전문 용어로 보기'),
  languageToggleBtn: (nextLanguage) => (nextLanguage === 'ko' ? '한국어' : 'English'),
  settingsBtn: '설정',
  themeToggleBtn: (nextTheme) => (nextTheme === 'dark' ? '다크 모드' : '라이트 모드'),
  dismissErrorLabel: '오류 닫기',
  authFailedConnectLabel: 'GitHub 연결 →',
  aiSuggestBtn: 'AI 제안',
  aiSuggestTitle: 'AI로 저장 메시지 제안 받기',
  aiDraftReady: 'AI가 저장 메시지를 작성했습니다. 검토한 뒤 진행 상황 저장을 다시 누르세요.',
  aiDraftFailed: 'AI가 저장 메시지를 작성하지 못했습니다. 계속하려면 직접 입력하세요.',
  draftingBtn: '작성 중...',
  thinkingBtn: '생각 중...',
  uploadedBranch: (branchName) => `${branchName} 버전을 올렸습니다`,
  openPullRequest: '풀 리퀘스트 열기',
  naturalUndoTitle: '말로 되돌리기',
  aiConnectionRequired: 'AI 연결 필요',
  cancelNaturalUndoLabel: '말로 되돌리기 취소',
  naturalUndoPlaceholder: '예: "어제 오후 빨간 버튼을 지우기 전으로 되돌려줘"',
  naturalUndoAnalyzingBtn: '분석 중...',
  naturalUndoFindBtn: '시점 찾기',
  confidenceLabel: (percent) => `확신도 ${percent}%`,
  restoreFiles: (count) => `${count}개 파일 되돌림`,
  removeFiles: (count) => `${count}개 파일 제거`,
  restoreFilePrefix: '되돌림',
  removeFilePrefix: '제거',
  restoringBtn: '되돌리는 중...',
  restorePointBtn: '이 시점으로 되돌리기',
  alternativeMatchesLabel: '원하는 시점이 아닌가요? 다른 후보:'
}

const KO_PRO: AppTerms = {
  ...KO_COMMON_APP_TERMS,
  sidebarTitle: '저장소',
  addRepo: '+ 저장소 추가',
  noReposHint: '아직 저장소가 없습니다.\n"저장소 추가"를 눌러 시작하세요.',

  stageAll: 'stage all',
  unstageAll: 'unstage all',
  stagedOf: (s, t) => `${s} / ${t} 스테이지됨`,
  loadingStatus: '상태 불러오는 중...',
  cleanTitle: '작업 트리 깨끗함',
  cleanSubtext: '커밋할 변경사항 없음',

  revertBtn: '되돌리기',
  revertTitle: '이 파일 변경사항 되돌리기',
  fileStatusLabel: (status) => KO_PRO_STATUS[status],
  selectProjectFilesText: '파일을 보려면 저장소를 선택하세요',
  collapseAllBtn: '모두 접기',
  expandAllBtn: '모두 펼치기',
  hiddenDepChangesBtn: (count) => `${count} changes in deps`,
  hideDependencyTitle: 'dependency 폴더 숨기기',
  showDependencyTitle: 'dependency 폴더 보기',
  hideDepsBtn: 'deps 숨김',
  showDepsBtn: 'deps 보기',
  reviewUntrackedBtn: (count) => `untracked 검토 (${count})`,
  reviewingUntrackedBtn: '검토 중...',
  stageFileLabel: (path) => `${path} 스테이지`,
  unstageFileLabel: (path) => `${path} 언스테이지`,
  untrackedReviewDialogLabel: 'untracked 검토',
  untrackedReviewTitle: 'Untracked 파일 검토',
  untrackedReviewCloseLabel: 'untracked 검토 닫기',
  untrackedReviewLoading: 'untracked 파일 분석 중...',
  untrackedReviewSummary: (total, commit, deleteCount) => `전체 ${total}개 커밋 후보 ${commit}개 삭제 후보 ${deleteCount}개`,
  deleteThisFileLabel: '이 파일 삭제',
  stageRecommendedFilesBtn: '추천 커밋 파일 스테이지',
  deletingBtn: '삭제 중...',
  deleteSelectedBtn: (count) => `선택 항목 삭제 (${count})`,

  commitPlaceholder: (hasStaged) => (hasStaged ? 'commit message...' : 'stage할 변경사항을 선택하세요'),
  commitBtn: (n) => `commit${n > 0 ? ` (${n})` : ''}`,
  committingBtn: 'commit 중...',
  pushBtn: 'push',
  pullBtn: 'pull',
  pushTitle: 'commit을 remote에 push',
  pullTitle: 'remote에서 pull',

  filesStaged: (n) => `${n}개 파일 스테이지됨`,
  toPush: (n) => `${n}개 푸시 필요`,
  toPull: (n) => `${n}개 풀 필요`,
  conflictMsg: '머지 충돌 감지됨',

  branchLabel: 'branch',
  newBranchBtn: '+ new branch',
  mergeBranchBtn: 'merge',
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

  initRepoBtn: 'Git 저장소 초기화',
  notARepoTitle: 'Git 저장소가 아님',
  notARepoDesc: '이 폴더는 아직 Git 저장소로 초기화되지 않았습니다.',

  committedToast: '커밋했습니다!',
  pushedToast: '푸시했습니다',
  pulledToast: '풀 완료',
  repoAdded: (name) => `"${name}" 저장소가 추가되었습니다`,
  repoAddFailed: '이 저장소를 열 수 없습니다. 다시 시도하세요.',
  repoRemoved: '저장소를 제거했습니다',
  repoOpenFailed: '이 저장소를 열 수 없습니다. 다시 시도하세요.',
  weeklyReportBtn: '주간 리포트',
  modeToggleBtn: (nextMode) => (nextMode === 'newbie' ? '쉬운 용어로 보기' : '전문 용어로 보기'),
  languageToggleBtn: (nextLanguage) => (nextLanguage === 'ko' ? '한국어' : 'English'),
  settingsBtn: '설정',
  themeToggleBtn: (nextTheme) => (nextTheme === 'dark' ? '다크 모드' : '라이트 모드'),
  dismissErrorLabel: '오류 닫기',
  authFailedConnectLabel: 'GitHub 연결 →',
  aiSuggestBtn: 'AI 제안',
  aiSuggestTitle: 'AI로 커밋 메시지 제안 받기',
  aiDraftReady: 'AI가 커밋 메시지를 작성했습니다. 검토한 뒤 커밋을 다시 누르세요.',
  aiDraftFailed: 'AI가 커밋 메시지를 작성하지 못했습니다. 계속하려면 직접 입력하세요.',
  draftingBtn: '작성 중...',
  thinkingBtn: '생각 중...',
  uploadedBranch: (branchName) => `${branchName} 브랜치를 푸시했습니다`,
  openPullRequest: '풀 리퀘스트 열기',
  naturalUndoTitle: '자연어 되돌리기',
  aiConnectionRequired: 'AI 연결 필요',
  cancelNaturalUndoLabel: '자연어 되돌리기 취소',
  naturalUndoPlaceholder: '예: "어제 오후 빨간 버튼을 지우기 전으로 되돌려줘"',
  naturalUndoAnalyzingBtn: '분석 중...',
  naturalUndoFindBtn: '시점 찾기',
  confidenceLabel: (percent) => `확신도 ${percent}%`,
  restoreFiles: (count) => `${count}개 파일 복원`,
  removeFiles: (count) => `${count}개 파일 제거`,
  restoreFilePrefix: '복원',
  removeFilePrefix: '제거',
  restoringBtn: '복원 중...',
  restorePointBtn: '이 시점으로 복원',
  alternativeMatchesLabel: '원하는 시점이 아닌가요? 다른 후보:'
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
