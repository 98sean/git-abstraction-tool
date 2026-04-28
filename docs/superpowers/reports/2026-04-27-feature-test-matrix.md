# Feature Test Matrix

Date: 2026-04-27

This report reflects the current app after the code audit, test coverage, and targeted optimization pass.

| Feature group | Implementation status | Automated test status | Manual smoke check | Remaining risk |
| --- | --- | --- | --- | --- |
| Project linking and local setup | Implemented. Folder inspection warns on generated/secret files and explicit `git init` is required for non-repos. | `inspectProjectFolder.test.ts`, `finalizeProjectLink.test.ts`, `ProjectLinkWizard.test.tsx` | Link a new folder, review warnings, finish linking, verify `.gitignore` entries. | Warning list may need more patterns as users bring new stacks. |
| File panel visibility | Implemented. Changed files and tracked files render together; dependency folders can be hidden or shown. | `renderHarness.test.tsx`, `FileManager.untrackedReview.test.tsx` | Toggle `Show deps` / `Hide deps`, confirm generated folders do not crowd normal review. | No visual regression snapshot yet. |
| Save Progress | Implemented. Staged files become commits, with optional AI save draft. | `ActionPanel.autoSaveMessage.test.tsx`, `autoSaveMessage.test.ts`, `service.test.ts` | Stage a file, save manually, then enable AI save draft and verify first click drafts only. | AI output quality still depends on provider response. |
| Connect AI and project AI settings | Implemented. One global provider/key; project-level auto-save toggle and one-time diff consent. | `aiConnection.test.ts`, `projectAiSettings.test.ts`, `ProjectSettingsPanel.test.tsx`, `ConnectAI.test.tsx` | Connect OpenAI or Anthropic, select model, enable project auto-save, approve consent. | Manual provider docs links are not tested end-to-end. |
| Natural Language Undo | Implemented. Manual AI restore-point suggestion with alternatives and explicit restore action. | `ActionPanel.naturalUndo.test.tsx`, `manualToolService.test.ts` | Enter a natural-language restore request and inspect the recommended commit before applying. | Restore application still requires careful user confirmation in real projects. |
| File Insight | Implemented and hardened. Only project-contained text files are analyzed; snippets are bounded. | `fileInsightSafety.test.ts`, `FileInsightPanel.test.tsx`, `manualToolService.test.ts` | Select a source file, refresh insight, select related files; try a binary image and verify rejection. | Binary detection is extension and NUL-byte based. |
| Untracked Review | Implemented. Rules classify obvious artifacts; AI reviews ambiguous files; deletion is selected and path-constrained. | `untrackedDelete.test.ts`, `FileManager.untrackedReview.test.tsx` | Review untracked files, stage recommended commit files, delete only checked delete recommendations. | Delete confirmation UX could be stronger for nervous users. |
| Weekly Report | Implemented. Rule-based summary works without AI; AI summary enhances when connected. | `WeeklyReport.test.tsx`, `weeklySummary.test.ts` | Open Weekly Report with AI disconnected, connected, empty week, and active week. | No pixel-level layout regression coverage. |
| GitHub backup upload | Implemented. Uses app-managed backup remote rather than silently reusing `origin`. | `safeUpload.test.ts`, `github/service.test.ts` | Configure backup target, upload, verify remote is `gat-backup`. | Real GitHub API permission failures depend on token scopes. |
| Team upload and PR handoff | Implemented. Explicit remote/branch target, invalid branch-name validation, PR compare link shown after upload. | `branchValidation.test.ts`, `CloudSetupWizard.test.tsx`, `TeamUploadHandoff.test.tsx`, `safeUpload.test.ts` | Configure team target, upload branch, open compare/PR link. | External browser opening is covered only as an anchor link. |
| Get Updates | Implemented for configured collaboration target with preview dialog. | Covered indirectly by git IPC and renderer smoke tests. | Configure team target, click Get Updates, review incoming commits, confirm pull. | More direct tests for preview dialog edge cases would help. |
| Branch management | Implemented. Create, switch, merge, delete branch flows remain available. | Existing branch service coverage plus `branchValidation.test.ts` | Create branch, switch, merge a test branch, delete it. | Remote branch deletion partial-failure UX can be expanded. |

## Final Verification Commands

```bash
npm test
npm run typecheck
```

Latest observed result during this pass:

- `npm test`: 28 test files, 68 tests passed
- `npm run typecheck`: passed
