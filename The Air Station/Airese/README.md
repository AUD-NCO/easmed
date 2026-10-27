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

In v1, the left pane's **For the team → Decisions to make** opens `v1/public/decisions.html`: open decisions blocking build (report contents, night classification, accounts), one question at a time, branching on earlier answers. On the last page, **I'm sure. Commit my decisions** appends the answers, with the person's name, date and time, to `v1/docs/DECISIONS-LOG.md` (local dev server only: `v1/scripts/decisions-log.js`, wired in `v1/metro.config.js`; entries from Kedar are skipped). **Dismiss and start again** throws them away. A refresh also starts again.

Changing a token or a shared component changes both versions. Screens, flows and copy live in each version.
