import path from 'node:path'
import { buildFileInsightAnalysisInput } from './fileInsightInput'
import { FileInsightResult, GenerateFileInsightInput } from './manualToolTypes'
import { AiProviderName } from './types'
import { TimelineCommitInfo } from '../git/types'

interface RelatedCandidate {
  path: string
  score: number
}

interface FileInsightOutput {
  file_path: string
  summary: string
  functionality: string
  related_files: FileInsightResult['relatedFiles']
}

interface FileInsightGitService {
  getTimeline(limit: number): Promise<TimelineCommitInfo[]>
  listTrackedFiles(): Promise<string[]>
}

interface FileInsightManualToolService {
  generateFileInsight(input: GenerateFileInsightInput): Promise<FileInsightResult>
}

interface GenerateFileInsightServiceInput {
  projectRoot: string
  filePath: string
  aiConfig: {
    provider: AiProviderName
    model: string
    apiKey: string
  }
  gitService: FileInsightGitService
  manualToolService: FileInsightManualToolService
}

function basename(pathValue: string): string {
  const normalized = pathValue.replace(/\\/g, '/')
  const parts = normalized.split('/')
  return parts[parts.length - 1] ?? normalized
}

function normalizeArtifactPath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/\/+$/, '')
}

export function isGitInternalArtifact(filePath: string): boolean {
  return normalizeArtifactPath(filePath)
    .split('/')
    .some((segment) => segment === '.git' || segment.endsWith('.git'))
}

function buildRelatedCandidates(
  filePath: string,
  trackedFiles: string[],
  timeline: TimelineCommitInfo[]
): RelatedCandidate[] {
  const scoreMap = new Map<string, number>()
  const fileDir = path.posix.dirname(filePath.replace(/\\/g, '/'))
  const fileBase = basename(filePath)
  const fileStem = fileBase.replace(/\.[^.]+$/, '')

  const addScore = (candidate: string, score: number): void => {
    if (!candidate || candidate === filePath) return
    scoreMap.set(candidate, (scoreMap.get(candidate) ?? 0) + score)
  }

  for (const commit of timeline) {
    if (!commit.changed_files.includes(filePath)) continue
    for (const changed of commit.changed_files) {
      addScore(changed, 3)
    }
  }

  for (const tracked of trackedFiles) {
    if (tracked === filePath) continue
    const trackedNorm = tracked.replace(/\\/g, '/')
    if (path.posix.dirname(trackedNorm) === fileDir) addScore(trackedNorm, 2)
    if (
      basename(trackedNorm).includes(fileStem) ||
      fileStem.includes(basename(trackedNorm).replace(/\.[^.]+$/, ''))
    ) {
      addScore(trackedNorm, 1)
    }
  }

  return Array.from(scoreMap.entries())
    .map(([candidatePath, score]) => ({ path: candidatePath, score }))
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, 12)
}

export async function generateFileInsight({
  projectRoot,
  filePath,
  aiConfig,
  gitService,
  manualToolService
}: GenerateFileInsightServiceInput): Promise<FileInsightOutput> {
  const analysisInput = await buildFileInsightAnalysisInput(projectRoot, filePath ?? '')
  const normalizedPath = analysisInput.filePath

  if (isGitInternalArtifact(normalizedPath)) {
    throw new Error('This looks like an embedded Git system file, so file insight is skipped.')
  }

  const [timeline, trackedFiles] = await Promise.all([
    gitService.getTimeline(260),
    gitService.listTrackedFiles()
  ])

  const relatedCandidates = buildRelatedCandidates(normalizedPath, trackedFiles, timeline)
  const recentCommits = timeline
    .filter((commit) => commit.changed_files.includes(normalizedPath))
    .slice(0, 8)
    .map((commit) => ({ date: commit.date, message: commit.message }))

  const insight = await manualToolService.generateFileInsight({
    provider: aiConfig.provider,
    model: aiConfig.model,
    apiKey: aiConfig.apiKey,
    filePath: normalizedPath,
    contentSnippet: analysisInput.contentSnippet,
    recentCommits,
    relatedCandidates
  })

  return {
    file_path: normalizedPath,
    summary: insight.summary,
    functionality: insight.functionality,
    related_files: insight.relatedFiles
  }
}
