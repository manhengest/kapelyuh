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
npx eas-cli login
npx eas-cli build:configure   # якщо ще не налаштовано
npx eas-cli build --profile development --platform ios
```

Після встановлення dev build на iPhone:

```bash
npx expo start --dev-client
```

## Скрипти


| Команда             | Опис                                        |
| ------------------- | ------------------------------------------- |
| `npm run typecheck` | `tsc --noEmit`                              |
| `npm run lint`      | ESLint                                      |
| `npm run format`    | Prettier check                              |
| `npm test`          | Jest                                        |
| `npm run build:db`  | Збірка `kapelyukh.db` з `scripts/words.csv` |

## Phase 5 — TestFlight beta (pre-upload gate)

Перед кожним завантаженням у TestFlight:

```bash
npm run typecheck && npm run lint && npm test
maestro test maestro/happy-path.yaml   # production/preview build на симуляторі або пристрої
npx eas-cli build --profile production --platform ios
npx eas-cli submit --platform ios --latest --profile production --groups "Internal"
```

Maestro CLI: `curl -fsSL "https://get.maestro.mobile.dev" | bash`

Деталі: [docs/eas-testflight.md](docs/eas-testflight.md), [docs/beta-test-matrix.md](docs/beta-test-matrix.md), [docs/beta-feedback.md](docs/beta-feedback.md).

Профіль `preview` — internal/ad-hoc без App Store Connect, для швидшої ітерації без TestFlight.
