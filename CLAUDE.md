# CLAUDE.md — Kapelyukh agent instructions

Offline Ukrainian party game (React Native + Expo). Read this before planning or implementing changes.

## Current app state

**Капелюх** is a feature-complete V1.0 iOS party game: one device, 2–N teams, one shared hat of words across three rounds (Еліас → Крокодил → Асоціація).

| Area          | Status                                                                                                                                             |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Version       | `package.json` `version` → `app.config.ts` → runtime via `getAppVersion()`; optional `APP_VERSION` in `.env.local`; iOS bundle `com.kapelyukh.app` |
| Platforms     | iPhone primary; iPad supported (`supportsTablet` + centered `ContentColumn`)                                                                       |
| Game loop     | Full: setup → teams → round-intro → turn → award → review → (next turn/round) → results → statistic                                                |
| Persistence   | Active match autosaved to MMKV; finished sessions in SQLite; settings in MMKV                                                                      |
| Words         | `scripts/words.csv` (~950 Ukrainian words) → `npm run build:db` → `assets/data/kapelyukh.db`                                                       |
| Monetization  | No ads / no IAP. `infrastructure/purchases/stub.ts` always returns `isPro: false` (Pro → V1.1)                                                     |
| Observability | Sentry (opt-in via Settings); crash reporting only                                                                                                 |
| Distribution  | EAS profiles: `development`, `development-simulator`, `preview`, `production` + TestFlight submit                                                  |
| Release gate  | Phase 5/6 docs in `docs/` (beta matrix, TestFlight, word-list sign-off) — treat as process, not code truth                                         |

**Screens (`src/app/`):** home, rules, settings, about, privacy; game: setup, teams, round-intro, turn, review, results, statistic.

**Not in V1:** accounts, network gameplay, custom word packs UI, IAP, Android release focus (package id exists, iOS is the shipping target).

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
  features/         Zustand stores, hooks, game UI (game/, settings/)
  domain/           pure TS game engine (reducer, selectors, scoring, wordSelector)
  infrastructure/   SQLite, MMKV, Sentry, haptics, audio, purchases stub
  ui/               design system (Button, Text, tokens, fonts)
  content/          Ukrainian strings + random team names
  shared/           cross-cutting hooks and utils
  types/            ambient type shims (assets, css)
```

**Dependency direction:** `app` → `features` → `domain` ← `infrastructure`. `domain/` must never import React, Expo, or upper layers (enforced by ESLint).

**State flow:** UI dispatches events → Zustand `features/game/store` → `domain/game/reducer` → selectors drive UI. Match state persists via `infrastructure/storage/activeMatch` (MMKV).

**Styling:** NativeWind `className` utilities + semantic component classes in [`global.css`](global.css) via `@apply`. Design tokens live in [`tailwind.config.js`](tailwind.config.js) only. Layout breakpoints stay in [`src/ui/theme/tokens.ts`](src/ui/theme/tokens.ts).

## Stack (pinned)

- Expo SDK **56**, React **19**, RN **0.85**, New Architecture enabled
- expo-router, Zustand 5, expo-sqlite, react-native-mmkv, NativeWind v4
- react-native-reanimated 4, expo-audio, expo-haptics, @sentry/react-native
- Fonts: Nunito (`@expo-google-fonts/nunito`)

## Commands

Before running any project command in the terminal, use Node **24.18.0** (see `.nvmrc`):

```bash
nvm use
```

| Command                           | When to use                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| `npm start`                       | Dev server (`scripts/dev.js`; use `--dev-client` after EAS dev build)              |
| `npm run ios` / `npm run android` | Same as start, platform flag                                                       |
| `npm run typecheck`               | After code changes — must pass                                                     |
| `npm run lint`                    | ESLint with zero warnings                                                          |
| `npm run format`                  | Prettier check                                                                     |
| `npm test`                        | Jest — prefer single spec files during iteration                                   |
| `npm run build:db`                | Regenerate `assets/data/kapelyukh.db` from `scripts/words.csv`                     |

CI (`.github/workflows/ci.yml`) runs typecheck + lint + format + test on every PR. Run `typecheck` + `lint` + `test` before finishing non-trivial work.

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

Key libraries: Expo SDK 56, expo-router, expo-sqlite, expo-audio, react-native-reanimated, NativeWind v4, Zustand 5, react-native-mmkv, @sentry/react-native.

## Code conventions

### Imports

Use path aliases from `tsconfig.json`: `@app/*`, `@features/*`, `@domain/*`, `@infrastructure/*`, `@ui/*`, `@shared/*`, `@content/*`, `@assets/*`.

Import order is enforced: builtin → external → internal, alphabetized, blank lines between groups.

### Components

- Follow `src/ui/components/Button.tsx` for canonical component structure.
- Use NativeWind (`className`), SCSS-backed utility classes, and tokens from `src/ui/theme/`.
- Minimum touch target: 48pt. Include `accessibilityRole` and `accessibilityLabel`.
- Wide layout: wrap screens in `ContentColumn` + `useIsWideLayout` (iPad).

### Domain

- All game transitions go through `domain/game/reducer.ts` and typed events in `domain/game/events.ts`.
- Keep reducers pure — no I/O, no `Date.now()` without passing `now` as a parameter.
- Add unit tests in `src/domain/**/__tests__/` for new logic.
- Carry-over leftover turn time between rounds is intentional (`CARRY_OVER_MIN_MS`).

### Features & screens

- Screen shells: `src/features/game/components/GameScreenShell.tsx`.
- Navigation helpers: `src/features/game/navigation.ts` (`STATUS_ROUTE`, `GameRouteSync`).
- Strings: `src/content/strings.ts` — do not introduce translation keys.
- Settings toggles today: sound, haptics, Sentry, skip-penalty default.

### Scope

- **Minimize diff** — simplest correct change; no drive-by refactors.
- **Match existing patterns** — read surrounding code before writing.
- **Comments** — explain _why_, not _what_. No comments on obvious code.
- **Tests** — add only when they cover real behavior; skip trivial assertions.

## Testing

- **Domain:** Jest unit tests, target high coverage on reducer/selectors/scoring.
- **Infrastructure:** repo and migration tests in `src/infrastructure/db/__tests__/`.
- **E2E:** Maestro happy path in `maestro/happy-path.yaml`.
- Run a focused spec during development: `npm test -- src/domain/game/__tests__/reducer.spec.ts`

## Git & commits

- Conventional commits: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.
- Remote is **GitHub** (`manhengest/kapelyuh`). Reference issues as `#<number>` when relevant.
- Small, focused pull requests with a clear purpose.
- **Do not commit** unless explicitly asked.

## Documentation map

| Path                   | Contents                                                      |
| ---------------------- | ------------------------------------------------------------- |
| `README.md`            | Setup, EAS dev build, scripts, TestFlight gate                |
| `PRIVACY.md`           | User agreement / privacy copy (Ukrainian)                     |
| `docs/`                | Beta/TestFlight, Sentry, word-list sign-off, design brief, TZ |
| `docs/design-brief.md` | Visual / UX brief                                             |
| `design/`              | Approved screen reference PNGs                                |
| `.cursor/plans/`       | Ad-hoc feature plans (not a single roadmap)                   |
| `scripts/words.csv`    | Word list source for SQLite build                             |

When docs and code disagree, **code is the source of truth** — update docs if you change behavior. (Example: `docs/word-list-signoff.md` word counts may lag `scripts/words.csv`.)

## Agent workflow

1. **Understand** — read relevant domain/store/screen files before editing.
2. **Plan** — for library-heavy work, query Context7 first.
3. **Implement** — stay within layer boundaries; keep changes focused.
4. **Verify** — `nvm use`, then `npm run typecheck && npm run lint && npm test`.
5. **Report** — summarize what changed and why; note anything not verified.

## Common pitfalls

- **Expo Go won't work** — MMKV and Sentry need a Development Build (`eas build --profile development`).
- **Don't put React in domain** — ESLint will reject it; extract pure functions instead.
- **Don't add i18n** — permanently out of scope.
- **Timer logic** — use absolute timestamps and `useAppStatePause`; never interval-only timers.
- **Word DB** — after editing `words.csv`, run `npm run build:db` and commit the regenerated `assets/data/kapelyukh.db`. App boot requires that asset (`SQLiteProvider` + `assetSource`).
- **Styles** — edit `global.css` for shared component classes and `tailwind.config.js` for tokens; use Tailwind utilities in TSX for one-off layout.
- **Pro / IAP** — do not wire StoreKit or RevenueCat in V1; keep the purchases stub.
