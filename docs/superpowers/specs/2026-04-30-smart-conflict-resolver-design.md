# Smart Conflict Resolver — Feature Spec

## Summary
When a pull or merge produces git conflicts, the app automatically surfaces a modal dialog that lets the user resolve each file by choosing their version or the incoming version, then completes the merge commit.

---

## Acceptance criteria

### Service layer (`GitService`)
1. `resolveConflict(filePath, 'ours')` runs `git checkout --ours -- <filePath>` then `git add <filePath>`.
2. `resolveConflict(filePath, 'theirs')` runs `git checkout --theirs -- <filePath>` then `git add <filePath>`.
3. `abortMerge()` runs `git merge --abort`.
4. Both methods throw a mapped `GitError` if the underlying git command fails.

### IPC handlers (`src/main/ipc/git.ts`)
5. `git:conflict:resolve` calls `resolveConflict` and invalidates the status cache.
6. `git:conflict:abort` calls `abortMerge` and invalidates the status cache.

### UI component (`ConflictResolver`)
7. Renders a title and description from i18n terms.
8. Renders one row per conflicted file, showing the file path.
9. Each unresolved row shows "Keep Mine" and "Keep Theirs" buttons.
10. Clicking "Keep Mine" calls `onResolve(filePath, 'ours')`.
11. Clicking "Keep Theirs" calls `onResolve(filePath, 'theirs')`.
12. After a file is resolved, its row shows a "Resolved" badge instead of the buttons.
13. While a resolve call is in flight for a file, that file's buttons are disabled.
14. Once all files are resolved, a commit message input and "Complete merge" button appear.
15. Clicking "Complete merge" calls `onComplete(message)`.
16. "Complete merge" is disabled when the commit message is empty.
17. Pressing Enter in the commit message input also triggers completion.
18. An "Abort merge" button is always visible; clicking it calls `onAbort()`.
19. A close (×) button is always visible; clicking it calls `onClose()`.

### Auto-open in App
20. When `status.has_conflicts` becomes true, the ConflictResolver dialog opens automatically.
21. The dialog is filtered to only files with `status === 'conflicted'`.
