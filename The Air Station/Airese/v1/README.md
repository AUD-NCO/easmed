# Airese

React Native app (Expo, TypeScript, expo-router) for iOS and Android.

## Run it on your phone

```bash
npm install
npx expo start        # scan the QR code with your phone
```

## Live prototype and docs

- **Prototype:** https://aud-nco.github.io/easmed/the-air-station/airese/v1/ (rebuilt and published on every push to `main`, see `.github/workflows/pages.yml` at the repo root)
- **Design system (visual):** https://aud-nco.github.io/easmed/the-air-station/airese/design-system/ (generated from the code)
- **Design system (reference):** [design-system/README.md](../design-system/README.md)
- **Product:** [docs/PRD.md](docs/PRD.md) · **Brand, voice and tone:** [design-system/docs/BRAND.md](../design-system/docs/BRAND.md) · **Recording rules:** [docs/RECORDING.md](docs/RECORDING.md)

## Browser preview (iPhone 17 Pro frame)

```bash
npm run preview       # writes ../preview-dist/v1/index.html
```

## Where things live

| Folder | What's in it |
| --- | --- |
| `../design-system/theme/tokens.ts`, `motion.ts` (shared, imported as `@ds/theme`) | Design tokens (colours, `alpha()`, spacing, corners, type) and motion presets. |
| `../design-system/components/` | The shared component library (`AppText`, `Button`, `DetailPage`, `VerdictCard`…), shared by v1 and v2. |
| `src/components/` | Components only this version uses (`MonthCalendar`, `NightTimeline`…). `index.ts` exports these plus the shared ones. |
| `src/screens/` | One file per screen. |
| `src/app/` | Routes (expo-router). Thin files that point at screens. |
| `src/lib/` | Non-UI logic, e.g. `permissions.ts` (system prompts). `.web.ts` files are browser-preview stand-ins. |
| `preview/`, `scripts/` | Browser preview and the design system page builder. Not shipped in the app. |

## Rules

- Screens use tokens and components only. No hard-coded colours, font sizes, timings or curves; tints are `alpha(colors.x, n)`.
- Keep the design system small. Add a token or component only when a screen needs it.
- Copy and visuals follow the brand brief in [design-system/docs/BRAND.md](../design-system/docs/BRAND.md): plain, factual, calm, useful; dark night UI with one warm light.
