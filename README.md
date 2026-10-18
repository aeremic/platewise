# Platewise

A food diary calendar for iOS and Android. Log what you ate each day by category, and see at a glance how healthy each day was: every category is green, orange or red, and each calendar day takes the color of its average.

- Calendar home with color-coded days and a quick **Add food** button
- Day sheet to log or remove foods for any date
- Editable categories (name, emoji, health color) with sensible defaults
- Everything stays on the device (SQLite) — no account, no network
- Dark theme with Liquid Glass on iOS 26 and a frosted-glass look on Android

## Tech

Expo SDK 57 · React Native 0.86 · TypeScript · Expo Router · expo-sqlite + Drizzle ORM · expo-glass-effect

## Getting started

Requirements: Node.js, Xcode (for iOS) and/or the Android SDK with an emulator, JDK 17.

```bash
npm install
npm run ios       # build and run on the iOS simulator
npm run android   # build and run on the Android emulator
```

These are development builds (not Expo Go). After the first build, start the bundler with `npm start` and reopen the installed app.

## Development

```bash
npm run typecheck
npm run lint
npm test
npm run db:generate   # after changing src/db/schema.ts
```

Project structure and conventions are documented in [AGENTS.md](AGENTS.md).

### USDA nutrition lookup (disabled)

"Look up" in the category editor (USDA FoodData Central) is **turned off** until the app has an official api.data.gov key. "Ask AI" (Google AI Mode) works without a key. To try Look up locally, set both variables in `.env.local` and restart `npm start`:

```bash
EXPO_PUBLIC_USDA_LOOKUP=enabled
EXPO_PUBLIC_FDC_API_KEY=your-key-here
```

Never ship a personal key in a store build. See `src/config/app.ts`.

## Releasing

Store builds are made with [EAS Build](https://docs.expo.dev/build/introduction/) (`eas.json`) and uploaded with EAS Submit.

```bash
npm run release:check            # placeholders, USDA switch, identifiers
node scripts/check-store-text.mjs # store text character limits
eas build --platform all --profile production
```

- App ID: `com.aeremic.platewise` (iOS and Android).
- Public website, privacy policy and support page: `docs/` (GitHub Pages).
- Store texts, answers for the privacy/data-safety forms and graphics: `store/`.
- Step-by-step owner checklist: [RELEASE_PLAN.md](RELEASE_PLAN.md).

## License

[MIT](LICENSE)
