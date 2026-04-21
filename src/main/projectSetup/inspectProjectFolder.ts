import { basename, join, relative } from 'node:path'
import { readdir, stat } from 'node:fs/promises'
import { GitService } from '../git/service'
import { ProjectFolderInspection, ProjectFolderWarning } from './types'

const LARGE_FILE_BYTES = 5 * 1024 * 1024
const GENERATED_DIRECTORY_NAMES = new Set(['node_modules', 'dist', 'build', 'coverage', 'out'])
const GENERATED_FILE_NAMES = new Set(['.DS_Store'])
const BINARY_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.mp4',
  '.mov',
  '.woff',
  '.woff2'
])

function isSensitiveName(fileName: string): boolean {
  return (
    fileName === '.env' ||
    fileName.startsWith('.env.') ||
    fileName.endsWith('.pem') ||
    fileName.endsWith('.key') ||
    fileName.endsWith('.p12') ||
    fileName.endsWith('.pfx') ||
    fileName.includes('secret')
  )
}

function isBinaryName(fileName: string): boolean {
  return [...BINARY_EXTENSIONS].some((extension) => fileName.endsWith(extension))
}

function createWarning(
  kind: ProjectFolderWarning['kind'],
  path: string,
  reason: string
): ProjectFolderWarning {
  return { kind, path, reason }
}

async function walkProjectFolder(rootPath: string, currentPath = rootPath): Promise<ProjectFolderWarning[]> {
  const warnings: ProjectFolderWarning[] = []
  const entries = await readdir(currentPath, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name === '.git') {
      continue
    }

    const fullPath = join(currentPath, entry.name)
    const relativePath = relative(rootPath, fullPath) || entry.name

    if (entry.isDirectory()) {
      if (GENERATED_DIRECTORY_NAMES.has(entry.name)) {
        warnings.push(
          createWarning('generated', relativePath, 'Generated folders usually should not be tracked.')
        )
        continue
      }

      warnings.push(...(await walkProjectFolder(rootPath, fullPath)))
      continue
    }

    if (!entry.isFile()) {
      continue
    }

    const fileStats = await stat(fullPath)

    if (isSensitiveName(entry.name)) {
      warnings.push(
        createWarning('sensitive', relativePath, 'Sensitive files may contain secrets or credentials.')
      )
    }

    if (GENERATED_FILE_NAMES.has(entry.name)) {
      warnings.push(
        createWarning('generated', relativePath, 'Generated files usually should not be tracked.')
      )
    }

    if (fileStats.size >= LARGE_FILE_BYTES) {
      warnings.push(
        createWarning('large', relativePath, 'Large files can make save history and uploads heavier.')
      )
    }

    if (isBinaryName(entry.name)) {
      warnings.push(
        createWarning('binary', relativePath, 'Binary files are harder to review and merge.')
      )
    }
  }

  return warnings
}

function buildRecommendedIgnoreEntries(warnings: ProjectFolderWarning[]): string[] {
  return [...new Set(warnings.map((warning) => basename(warning.path)))]
}

export async function inspectProjectFolder(localPath: string): Promise<ProjectFolderInspection> {
  const gitService = new GitService(localPath)
  const isGitRepo = await gitService.isRepository()
  const remotes = isGitRepo ? await gitService.getRemotes() : []
  const warnings = await walkProjectFolder(localPath)

  return {
    isGitRepo,
    canInitialize: !isGitRepo,
    remotes,
    warnings,
    recommendedIgnoreEntries: buildRecommendedIgnoreEntries(warnings)
  }
}
