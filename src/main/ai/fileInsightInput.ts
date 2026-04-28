import { open, stat } from 'node:fs/promises'
import path from 'node:path'

export const FILE_INSIGHT_SNIPPET_MAX_CHARS = 12_000
const FILE_INSIGHT_READ_MAX_BYTES = 64_000

const BINARY_EXTENSIONS = new Set([
  '.avif',
  '.bmp',
  '.class',
  '.dll',
  '.dmg',
  '.exe',
  '.gif',
  '.ico',
  '.jar',
  '.jpeg',
  '.jpg',
  '.mov',
  '.mp3',
  '.mp4',
  '.pdf',
  '.png',
  '.so',
  '.webp',
  '.zip'
])

export interface FileInsightAnalysisInput {
  filePath: string
  absolutePath: string
  contentSnippet: string
  truncated: boolean
}

function normalizeProjectPath(filePath: string): string {
  return filePath.replace(/\\/g, '/').trim()
}

function toSafeAbsolutePath(projectRoot: string, filePath: string): string {
  const normalized = normalizeProjectPath(filePath)
  const absolute = path.resolve(projectRoot, normalized)
  const rel = path.relative(projectRoot, absolute)
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Invalid file path.')
  }
  return absolute
}

function isLikelyBinaryPath(filePath: string): boolean {
  return BINARY_EXTENSIONS.has(path.extname(filePath).toLowerCase())
}

function isLikelyBinaryBuffer(buffer: Buffer): boolean {
  return buffer.subarray(0, Math.min(buffer.length, 4096)).includes(0)
}

function toTextSnippet(content: string, truncatedByReadLimit: boolean): string {
  if (!content) return ''

  const truncatedByCharLimit = content.length > FILE_INSIGHT_SNIPPET_MAX_CHARS
  const snippet = truncatedByCharLimit
    ? content.slice(0, FILE_INSIGHT_SNIPPET_MAX_CHARS)
    : content

  return truncatedByCharLimit || truncatedByReadLimit ? `${snippet}\n...` : snippet
}

async function readBoundedFile(absolutePath: string, size: number): Promise<Buffer> {
  const handle = await open(absolutePath, 'r')
  try {
    const length = Math.min(size, FILE_INSIGHT_READ_MAX_BYTES)
    const buffer = Buffer.alloc(length)
    const { bytesRead } = await handle.read(buffer, 0, length, 0)
    return buffer.subarray(0, bytesRead)
  } finally {
    await handle.close()
  }
}

export async function buildFileInsightAnalysisInput(
  projectRoot: string,
  filePath: string
): Promise<FileInsightAnalysisInput> {
  const normalizedPath = normalizeProjectPath(filePath)
  if (!normalizedPath) {
    throw new Error('Please select a file first.')
  }

  if (isLikelyBinaryPath(normalizedPath)) {
    throw new Error('File Insight only analyzes text files. Choose a source, config, or document file.')
  }

  const absolutePath = toSafeAbsolutePath(projectRoot, normalizedPath)
  const fileStat = await stat(absolutePath)
  if (!fileStat.isFile()) {
    throw new Error('File Insight only analyzes files, not folders.')
  }

  const buffer = await readBoundedFile(absolutePath, fileStat.size)
  if (isLikelyBinaryBuffer(buffer)) {
    throw new Error('File Insight only analyzes text files. Choose a source, config, or document file.')
  }

  const truncated = fileStat.size > FILE_INSIGHT_READ_MAX_BYTES
  return {
    filePath: normalizedPath,
    absolutePath,
    contentSnippet: toTextSnippet(buffer.toString('utf8'), truncated),
    truncated
  }
}
