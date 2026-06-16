# Капелюх

Офлайн українська party-гра «Капелюх» для iPhone — один пристрій, три тури, спільний набір слів.

## Стек

- React Native + Expo SDK 56 (Development Build via EAS)
- TypeScript `strict`
- expo-router, Zustand, MMKV, NativeWind, Sentry

## Розробка

```bash
npm install
npm start
```

Для нативних модулів (MMKV, Sentry) потрібен **Development Build**, не Expo Go:

```bash
npx eas login
npx eas build:configure   # якщо ще не налаштовано
npx eas build --profile development --platform ios
```

Після встановлення dev build на iPhone:

```bash
npx expo start --dev-client
```

## Скрипти

| Команда             | Опис           |
| ------------------- | -------------- |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint`      | ESLint         |
| `npm run format`    | Prettier check |
| `npm test`          | Jest           |

## Phase 0 — ручні кроки

1. **Apple Developer** — підтвердити enrollment ($99/рік).
2. **Bundle ID** — зареєструвати `com.kapelyukh.app` в [Apple Developer → Identifiers](https://developer.apple.com/account/resources/identifiers/list).
3. **EAS** — `npx eas init`, оновити `app.json` → `extra.eas.projectId`.
4. **Sentry** — створити проєкт, скопіювати DSN у `.env.local` як `EXPO_PUBLIC_SENTRY_DSN=...`.
5. **Dev Build** — `eas build --profile development --platform ios`, встановити на фізичний iPhone, перевірити запуск.

## Структура

```
src/
  app/              expo-router екрани
  features/         Zustand slices, hooks
  domain/           чистий TS game engine (без React/Expo)
  infrastructure/   storage, db, Sentry
  ui/               design system
  content/          українські рядки (без i18n)
```

Документація продукту: `docs/`, план розробки: `.cursor/plans/`.
