---
name: deploy
description: Gate the current branch against origin/master (code review, style, tests), then patch-bump the app version and push. Blocks on must-fix or should-fix findings.
---

# /deploy — review, bump, push

Ship the current branch only after it clears review + style + tests against `origin/master`. Any **must-fix** or **should-fix** finding blocks. On success: patch-bump `package.json` (e.g. `1.0.5` → `1.0.6`) and push every allowed change on this branch.

## Hard rules

- Never force-push. Never `--no-verify`. Never amend.
- Never stage or push secrets, `.env*`, keys, `node_modules/`, build artifacts, or OS junk.
- Do not bump `ios.buildNumber`. Do not create git tags.
- Do not ask where the spec is. If none is found, skip the Spec axis and continue.
- Stop at the first failed gate. Do not bump or push after a failure.

## Progress

```
/deploy progress:
- [ ] 1. Inspect + fetch
- [ ] 2. Code review vs origin/master
- [ ] 3. Style
- [ ] 4. Tests
- [ ] 5. Verdict
- [ ] 6. Patch-bump + commit
- [ ] 7. Push current branch
```

Steps 2–4 may run in parallel after step 1. Step 5 waits for all three. Steps 6–7 run only on a clean verdict.

### 1. Inspect + fetch

Run:

```bash
git status
git rev-parse --abbrev-ref HEAD
git fetch origin master
git rev-parse origin/master
git log origin/master..HEAD --oneline
git diff --stat origin/master
```

**Done when:** `origin/master` resolves and you know branch, commits ahead, and the ship delta.

**Stop now (no bump, no push) if:** not a git repo, detached HEAD, or there is nothing to ship (no commits ahead of `origin/master`, clean tracked tree, no relevant untracked files).

### 2. Code review vs origin/master

Read and follow `.claude/skills/code-review/SKILL.md` with fixed point **`origin/master`**.

Ship delta to review (committed + working tree, not only `HEAD`):

```bash
git diff origin/master
git status --short
```

Include relevant untracked source/tests/config that will be committed. Skip the skill's "fail on empty committed diff" when the working tree still has a delta.

Spawn the Standards and Spec sub-agents as that skill requires. Standards sources include `CLAUDE.md` plus the skill's smell baseline. Skip Spec if no issue/spec is found in commit messages or `docs/` / `.cursor/plans/` — do not wait for the user.

Then classify **every** finding:

| Severity | Use for | Deploy |
|----------|---------|--------|
| **must-fix** | Documented-standard hard breach; spec missing/wrong; security, data loss, secret leak, broken contract, domain impurity (React/Expo in `src/domain/`) | Block |
| **should-fix** | Concrete smell with a quoted hunk that would delay merge; missing tests for new domain logic; layering or product-constraint breach that is not already a must-fix | Block |
| **nit** | Optional naming, speculative smells without a hunk, things Prettier/ESLint already cover | Continue |

Do not promote nits to should-fix. Omit findings with no file/hunk.

**Done when:** each finding is labelled must-fix, should-fix, or nit, or the review is clean.

### 3. Style

```bash
nvm use
npm run typecheck
npm run lint
npm run format
```

**Done when:** all three exit 0. Any non-zero → **must-fix**, stop.

### 4. Tests

```bash
nvm use
npm test
```

**Done when:** Jest exits 0. Any non-zero → **must-fix**, stop.

### 5. Verdict

- **BLOCKED** if any must-fix, any should-fix, or any failed command in steps 3–4. Report and stop. Do not bump. Do not push.
- **OK** only if review has zero must-fix and zero should-fix, and style + tests passed. Nits do not block; list them in the report.

### 6. Patch-bump + commit

Only after **OK**:

1. `nvm use && npm version patch --no-git-tag-version` (updates `package.json` + lockfile only).
2. Stage allowed files: existing ship delta + the version files. Leave excluded files unstaged.
3. Commit with HEREDOC. Prefer two commits when there is feature work plus the bump:
   - feature/fix commit from the diff (conventional: `feat` / `fix` / `chore`)
   - then `chore: bump version to <new>`
   - If the tree was already committed and only the bump is new, one version commit is enough.
4. If commit intent for leftover WIP is genuinely ambiguous, ask once and wait. Version bump itself does not need a question.

**Done when:** `package.json` version is one patch above the pre-deploy value, and that bump is committed.

### 7. Push current branch

```bash
git pull --rebase --autostash
git push -u origin HEAD
```

If already tracking, `git push` is enough. Request permissions if git network is blocked.

On rebase conflicts: **stop**. Leave the version commit local. Report conflicted files.

**Done when:** `git status` shows the branch up to date with its remote.

## Report

Lead with **SUCCESS** or **BLOCKED**.

```markdown
## /deploy — SUCCESS

- Branch: `<name>`
- Review vs `origin/master`: 0 must-fix, 0 should-fix
- Nits: <list or "none">
- Style: typecheck ✅ lint ✅ format ✅
- Tests: ✅
- Version: `<old>` → `<new>`
- Pushed: `origin/<branch>` @ `<sha>`
```

```markdown
## /deploy — BLOCKED

- Branch: `<name>`
- Stopped at: <step>
- Must-fix:
  1. <file:line> — <why>
- Should-fix:
  1. <file:line> — <why>
- Nits: ...
- Version: not bumped
- Not pushed
- Next: 1. <fix>  2. Re-run /deploy
```
