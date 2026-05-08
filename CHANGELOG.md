# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] — 2025-05-08

### Added
- Local-first project linking with `git init` gating and pre-save file warnings
- Save Progress workflow: stage, write or generate a commit message, commit locally
- Full file visibility panel: tracked, modified, staged, untracked, and clean files in one view
- Dependency hiding: `node_modules` and generated folders collapsed by default, expandable with Show deps
- Branch management: create, switch, merge, and delete local branches with default-branch guardrails
- GitHub upload with two modes — private backup repository and team collaboration branch
- Pull update preview: inspect incoming commits and changed files before pulling
- Auto Save Message: AI-generated commit message from staged diff with 3–5 s timeout fallback
- Natural Language Undo: find and preview a restore point using plain-language queries
- Untracked File Review: two-tier classification (rule-based fast pass + AI for ambiguous files)
- File Insight: read-only AI explanation of a selected file's purpose and related context
- Smart Conflict Resolver: guided file-by-file merge dialog without exposing raw conflict markers
- Weekly Report: Git statistics + AI commit summaries compiled into a readable narrative
- Language selector: English and 한국어
- Terminology mode: Newbie (Save Progress / Version / Upload) and Pro (Commit / Branch / Push)
- OpenAI and Anthropic provider support; keys stored with Electron safeStorage
- GitHub device login and Personal Access Token support; tokens stored with Electron safeStorage
- Safety rules enforced throughout: no silent git init, no force push, no auto conflict resolution, no AI diff without project consent
