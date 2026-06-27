# CLAUDE.md — Kapelyukh agent instructions

Offline Ukrainian party game (React Native + Expo). Read this before planning or implementing changes.

## Product constraints (non-negotiable)

- **Offline-first, single device** — no accounts, backend, or network for gameplay.
- **Ukrainian-only** — no i18n layer. User-facing strings live in `src/content/strings.ts` or as Ukrainian literals in components. Use `Intl` with `'uk-UA'` for dates/numbers.
- **Pure domain engine** — game logic in `src/domain/` is React-free and side-effect-free.
- **Reliability over flash** — timer accuracy, autosave, and session resume beat animations.
- **No ads, no IAP in V1.0** — Pro is deferred to V1.1.

## Architecture

```
src/
  app/              expo-router screens
  features/         Zustand store, hooks, screen components
  domain/           pure TS game engine (reducer, selectors, scoring)
  infrastructure/   SQLite, MMKV, Sentry, haptics
  ui/               design system (Button, tokens, theme)
  content/          Ukrainian strings
  shared/           cross-cutting hooks and utils
```

**Dependency direction:** `app` → `features` → `domain` ← `infrastructure`. `domain/` must never import React, Expo, or upper layers (enforced by ESLint).

**State flow:** UI dispatches events → Zustand store → `domain/game/reducer` → selectors drive UI.

## Commands

| Command | When to use |
| --- | --- |
| `npm start` | Dev server (use `--dev-client` after EAS dev build) |
| `npm run typecheck` | After code changes — must pass |
| `npm run lint` | ESLint with zero warnings |
| `npm run format` | Prettier check |
| `npm test` | Jest — prefer single spec files during iteration |
| `npm run build:db` | Regenerate `assets/data/kapelyukh.db` from `scripts/words.csv` |

CI runs all of the above on every PR. Run `typecheck` + `lint` + `test` before finishing non-trivial work.

## Context7 — use for library docs

**Before implementing or planning code that touches third-party APIs**, fetch current documentation via Context7 MCP instead of relying on training data.

### When to use Context7

- Adding or changing Expo / React Native / Reanimated / SQLite / Zustand / NativeWind behavior
- Setup, configuration, or migration questions for any dependency
- Unsure about API signatures, breaking changes, or version-specific behavior

### When NOT to use Context7

- Refactoring project code, debugging game logic, or code review
- General programming concepts unrelated to a specific library

### Workflow

1. **Resolve library ID** — call `resolve-library-id` with `libraryName` and a specific `query`.
2. **Query docs** — call `query-docs` with the resolved `libraryId` and your task-specific question.
3. **Prefer version-specific IDs** when the stack pins a version (e.g. Expo SDK 56, React 19).
4. **Limit calls** — max 3 resolve + 3 query calls per task; be specific in queries.

Key libraries for this project: Expo SDK 56, expo-router, expo-sqlite, react-native-reanimated, NativeWind v4, Zustand 5, react-native-mmkv, @sentry/react-native.

## Code conventions

### Imports

Use path aliases from `tsconfig.json`: `@app/*`, `@features/*`, `@domain/*`, `@infrastructure/*`, `@ui/*`, `@shared/*`, `@content/*`.

Import order is enforced: builtin → external → internal, alphabetized, blank lines between groups.

### Components

- Follow `src/ui/components/Button.tsx` for canonical component structure.
- Use NativeWind (`className`) and tokens from `src/ui/theme/`.
- Minimum touch target: 48pt. Include `accessibilityRole` and `accessibilityLabel`.

### Domain

- All game transitions go through `domain/game/reducer.ts` and typed events in `domain/game/events.ts`.
- Keep reducers pure — no I/O, no `Date.now()` without passing `now` as a parameter.
- Add unit tests in `src/domain/**/__tests__/` for new logic.

### Features & screens

- Screen shells: `src/features/game/components/GameScreenShell.tsx`.
- Navigation helpers: `src/features/game/navigation.ts`.
- Strings: `src/content/strings.ts` — do not introduce translation keys.

### Scope

- **Minimize diff** — simplest correct change; no drive-by refactors.
- **Match existing patterns** — read surrounding code before writing.
- **Comments** — explain *why*, not *what*. No comments on obvious code.
- **Tests** — add only when they cover real behavior; skip trivial assertions.

## Testing

- **Domain:** Jest unit tests, target high coverage on reducer/selectors/scoring.
- **Infrastructure:** repo and migration tests in `src/infrastructure/db/__tests__/`.
- **E2E:** Maestro happy path in `maestro/happy-path.yaml`.
- Run a focused spec during development: `npm test -- src/domain/game/__tests__/reducer.spec.ts`

## Git & commits

- Conventional commits: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.
- Reference GitLab issues as `#<number>` in commit messages and MR descriptions.
- Small, focused merge requests with a clear purpose.
- **Do not commit** unless explicitly asked.

## Documentation map

| Path | Contents |
| --- | --- |
| `README.md` | Setup, EAS dev build, scripts |
| `docs/` | Product and design docs |
| `.cursor/plans/` | Unified development plan and phase milestones |
| `scripts/words.csv` | Word list source for SQLite build |

When docs and code disagree, **code is the source of truth** — update docs if you change behavior.

## Agent workflow

1. **Understand** — read relevant domain/store/screen files before editing.
2. **Plan** — for library-heavy work, query Context7 first.
3. **Implement** — stay within layer boundaries; keep changes focused.
4. **Verify** — `npm run typecheck && npm run lint && npm test`.
5. **Report** — summarize what changed and why; note anything not verified.

## Common pitfalls

- **Expo Go won't work** — MMKV and Sentry need a Development Build (`eas build --profile development`).
- **Don't put React in domain** — ESLint will reject it; extract pure functions instead.
- **Don't add i18n** — permanently out of scope.
- **Timer logic** — use absolute timestamps and `useAppStatePause`; never interval-only timers.
- **Word DB** — after editing `words.csv`, run `npm run build:db` and commit the regenerated `.db` if part of the task.
