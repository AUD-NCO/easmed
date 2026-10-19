# Airese

Two versions of the Airese app, built on one shared design system.

| Folder | What it is | Prototype |
| --- | --- | --- |
| `v1/` | Pilot release: v2 with less functionality and some UX changes | https://aud-nco.github.io/easmed/the-air-station/airese/v1/ |
| `v2/` | The full app | https://aud-nco.github.io/easmed/the-air-station/airese/v2/ |
| `design-system/` | Tokens, shared components, brand brief. Used by both versions as `@ds/...` | https://aud-nco.github.io/easmed/the-air-station/airese/design-system/ |

## Run it

```bash
npm install          # once, from this folder (one node_modules for v1 and v2)
npm run v1           # http://localhost:8081/iphone.html
npm run v2           # http://localhost:8082/iphone.html
npm run preview      # builds preview-dist/v1, v2 and design-system, as published
```

Changing a token or a shared component changes both versions. Screens, flows and copy live in each version.
