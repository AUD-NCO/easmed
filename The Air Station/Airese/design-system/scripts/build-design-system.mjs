/**
 * Builds the public design system page from the source, so it never drifts from the code:
 * colours, type, spacing, corners and motion are read from design-system/theme; icons from Icon.tsx;
 * each component's description from its doc comment, and where it's used from v2's screens.
 * Brand assets (logo, app icon, illustrations) are read from v2/assets.
 *
 *   npm run design-system (from Airese/)  →  preview-dist/design-system/index.html (+ img/)
 *
 * Published to GitHub Pages with the prototypes:
 * https://aud-nco.github.io/easmed/the-air-station/airese/design-system/
 * Also refreshes design-system/img/ (logos on a Midnight tile) and design-system/swatches/ (one SVG per
 * colour token, loudness step and gradient, written from tokens.ts) used by design-system/README.md.
 */
import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { createHash } from 'node:crypto';

// Paths are relative to Airese/, which holds design-system/, v1/ and v2/.
const root = decodeURIComponent(new URL('../..', import.meta.url).pathname);
const APP = 'v2';
const out = join(root, 'preview-dist/design-system');
const REPO = 'https://github.com/AUD-NCO/easmed/blob/main/The%20Air%20Station/Airese';
const read = (p) => readFileSync(join(root, p), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- Read the source ----------

const tokens = read('design-system/theme/tokens.ts');
const block = (name) => tokens.match(new RegExp(`(?:const|export const) ${name} = \\{([\\s\\S]*?)\\n\\}`))[1];

// Palette: name: '#hex', // what it's for
// Token comments carry history and asides; the page shows only the first plain clause.
const clean = (note = '') => note.split(/ \(|\. |; |: (?=[A-Z])/)[0].trim();
const palette = [...block('palette').matchAll(/(\w+): '(#[0-9A-Fa-f]{6})', \/\/ (.*)/g)].map(([, name, hex, note]) => ({ name, hex, note: clean(note) }));
const hexOf = Object.fromEntries(palette.map((p) => [p.name, p.hex]));

// Roles and other colours: name: palette.x | alpha(palette.x, 0.16) | 'literal', // note
const rgba = (hex, a) => `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')}, ${a})`;
const colorLines = [...block('colors').matchAll(/^\s+(\w+): (palette\.\w+|alpha\(palette\.\w+, [\d.]+\)|'[^']+'),?(?: \/\/ (.*))?$/gm)].map(([, name, v, note]) => {
  const tint = v.match(/^alpha\(palette\.(\w+), ([\d.]+)\)$/);
  return {
    name,
    value: tint ? rgba(hexOf[tint[1]], tint[2]) : v.startsWith('palette.') ? hexOf[v.slice(8)] : v.slice(1, -1),
    ref: tint ? `${tint[1]} at ${Math.round(Number(tint[2]) * 100)}%` : v.startsWith('palette.') ? v.slice(8) : null,
    note: clean(note ?? ''),
  };
});
const loudness = [...tokens.matchAll(/export const loudness = \{([^}]*)\}/g)][0][1].split(',').map((s) => s.trim()).filter(Boolean).map((s) => s.match(/(\w+): (palette\.\w+|'#\w+')/)).map(([, n, v]) => ({ name: n, hex: v.startsWith('palette.') ? hexOf[v.slice(8)] : v.slice(1, -1) }));
const gradients = [...block('gradients').matchAll(/(\w+): \[([\s\S]*?)\]/g)].map(([, name, body]) => ({
  name,
  stops: [...body.matchAll(/offset: ([\d.]+), color: (palette\.\w+|'#\w+')/g)].map(([, o, c]) => ({ offset: Number(o), color: c.startsWith('palette.') ? hexOf[c.slice(8)] : c.slice(1, -1) })),
}));
const numbers = (name) => [...block(name).matchAll(/(\w+): (\d+),(?: \/\/ (.*))?/g)].map(([, n, v, note]) => ({ name: n, value: Number(v), note: clean(note ?? '') }));
const space = numbers('space');
const radius = numbers('radius');
const typeScale = [...tokens.matchAll(/^\s+(\w+): \{ \.\.\.font\('(\w+)', '(\d+)'\), fontSize: (\d+), lineHeight: (\d+) \},? \/\/ (.*)$/gm)].map(([, name, family, weight, size, lh, note]) => ({
  name,
  family,
  weight: Number(weight),
  size: Number(size),
  lh: Number(lh),
  note: clean(note),
}));

const motionSrc = read('design-system/theme/motion.ts');
const preset = (name) => {
  const b = motionSrc.match(new RegExp(`${name}: \\{([\\s\\S]*?)\\n  \\}`))[1];
  const curve = (k) => b.match(new RegExp(`${k}: Easing\\.bezier\\(([^)]*)\\)`))[1];
  return { name, duration: Number(b.match(/duration: (\d+)/)[1]), easeOut: curve('easeOut'), easeIn: curve('easeIn'), easeInOut: curve('easeInOut') };
};
const presets = [preset('slow'), preset('fast')];
const ambient = Number(motionSrc.match(/ambient: \{ duration: (\d+)/)[1]);
const attention = motionSrc.match(/attention: \{ duration: (\d+), rest: (\d+)/);
const glint = motionSrc.match(/glint: \{ duration: (\d+), rest: (\d+)/);
const stagger = Number(motionSrc.match(/stagger: (\d+)/)[1]);

const iconSrc = read('design-system/components/Icon.tsx');
const icons = [...iconSrc.matchAll(/^\s+(\w+): '([Mm][^']+)'/gm)].map(([, name, d]) => ({ name, d }));
// Health Icons (48 × 48 grid, one or more paths each) for what Material doesn't have
const healthIcons = [...iconSrc.matchAll(/^\s+(\w+): \[(.+)\],$/gm)].map(([, name, body]) => ({
  name,
  paths: [...body.matchAll(/(\{ d: )?'([^']+)'(, evenodd: true \})?/g)].map(([, , d, evenodd]) => ({ d, evenodd: !!evenodd })),
}));

// Components: first doc comment, exports, and the screens that render them.
const files = [];
const walk = (d) => readdirSync(join(root, d)).forEach((f) => (statSync(join(root, d, f)).isDirectory() ? walk(join(d, f)) : /\.tsx?$/.test(f) && files.push(join(d, f))));
['design-system/components', `${APP}/src`, `${APP}/preview`].forEach(walk);
const sources = Object.fromEntries(files.map((f) => [f, read(f)]));
const docOf = (src, name) => {
  // The doc comment right above the export, else the file's first one.
  const at = src.search(new RegExp(`export (?:function|const) ${name}\\b`));
  const before = at > 0 ? src.slice(0, at) : src;
  const docs = [...before.matchAll(/\/\*\*([\s\S]*?)\*\//g)];
  const raw = docs.length ? docs[docs.length - 1][1] : '';
  // For the page: the first paragraph only, without notes meant for developers
  // (PRD references, "after the reference", Prototype / Engineering / Direction notes).
  return raw
    .split('\n')
    .map((l) => l.replace(/^\s*\*\s?/, ''))
    .join('\n')
    .trim()
    .split(/\n\s*\n/)[0]
    .replace(/\s*\((?:PRD|after the reference|see )[^)]*\)/gi, '')
    .split('\n')
    .filter((l) => !/^(Prototype|Engineering|Direction|BROWSER PREVIEW|Source:)/i.test(l.trim()))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
};
const usedIn = (name) =>
  [
    ...new Set(
      Object.entries(sources)
        .filter(([f, s]) => !f.endsWith(`/${name}.tsx`) && new RegExp(`<${name}[\\s/>]`).test(s))
        .map(([f]) => basename(f).replace(/\.tsx?$/, '').replace(/Screen$/, '').replace(/^_layout.*/, 'Root layout').replace(/^index$/, 'Preview')),
    ),
  ];

// One line per component for the page (plain, short). Code doc comments stay for developers.
const BLURB = {
  "AppText": "The only text component. Applies a type style and colour; scales to 200%.",
  "Icon": "A Material Symbol by name, size and colour token; a Health Icon where Material has none.",
  "Logo": "The stacked Airese logo.",
  "PageTitle": "Large title for a tab's page, the same on every tab, with a control on the right (Home: avatar; Reports: calendar).",
  "PromptLayout": "Full-screen prompt: a 200 pt graphic, then headline, reason, an optional how-to-fix line with a Lamp lightbulb, one button. Skip or × top right. PromptBody is the same content inside a page with its own header.",
  "DetailPage": "Page template: back button (or none on a tab page), large title, subtitle with an optional tag, top-right control, sticky compact title on scroll, optional sticky footer.",
  "AmbientGradient": "The splash blues with two faint glows drifting across. Static with Reduce Motion.",
  "TabBar": "Floating two-tab bar for web and the preview. Native builds use the system tab bar.",
  "Screen": "Background, safe areas and status bar for a full screen.",
  "Button": "Pill button, 48 pt. Primary: Breath fill. Quiet: text only. Mini: a small Midnight pill for banners and cards.",
  "IconButton": "Round 56 pt Breath button with an icon. Needs an accessibility label.",
  "InfoButton": "The (i) that opens an explanation.",
  "Avatar": "44 pt glassy circle with initials, or a person icon. Opens Profile. Exports titleControl, the look shared with the Reports calendar button.",
  "ToggleChip": "Pill that switches on and off. Reads as a checkbox.",
  "ChipGroup": "Wraps chips across lines.",
  "IconChoiceGrid": "Multi-select as a grid of round icons with labels, four to a row. Chosen: Breath ring and a check.",
  "SettingSwitch": "A label (with an optional icon) and a switch. Greyed out when disabled.",
  "SegmentedControl": "iOS-style segmented control with a sliding Breath thumb.",
  "FormGroup": "Grouped form card with a title and footer. Outlines on focus and on error. onSheet for use inside a sheet.",
  "FormTitle": "The one section label: small, uppercase, Mist, 1 pt tracking.",
  "PhoneField": "Phone number with a flag and country-code chip; formats as you type. Exports CountrySheet (searchable, Singapore and Malaysia first).",
  "Checkbox": "A 44 pt checkbox with a sentence beside it that can hold inline links (InlineLink).",
  "WheelPicker": "A scroll wheel for one number from a range (year of birth). Tap a row or swipe; adjustable for screen readers.",
  "RulerPicker": "A ruler to drag under a needle (height, weight), with − / + and a number you can type.",
  "AboutYou": "Gender, age, height, weight and where you live as tiles; each opens a small sheet for that one question.",
  "FormInput": "A plain text input row.",
  "FormDivider": "Hairline between rows.",
  "SettingRow": "Row with icon, title and detail. Chevron opens a page; an action pill acts in place.",
  "Card": "Deep surface with optional title and (i).",
  "InsightCard": "A plain-language takeaway. Tones: plain, hero (a no-data night), warm (what it means).",
  "VerdictCard": "The night's verdict: headline, a sentence, one button by mood, and the week as a graph behind the words within a 7:1 contrast budget, drawn on load by a shine.",
  "DataCard": "Results card in two shapes, wide and square: label, visual or number, one line of insight.",
  "BigNumber": "The big number in a card. No small units.",
  "ScoreTile": "Headline score: a ring with the number or an icon, the name, a level word, and a trend line when there's one to show.",
  "BottomSheet": "Sheet over a dimmed screen. Tap outside or drag down to close.",
  "ExplainSheet": "Short explanation in a sheet, with an optional action.",
  "TopSheet": "The bottom sheet's twin, dropping down from the top (the Reports calendar). Drag up or tap outside to close.",
  "LargeSheet": "Near full-height sheet for “more” on a card.",
  "PermissionSheet": "Asks again for a permission, or points to Settings if the system won’t ask.",
  "Toast": "Short confirmation that fades in and out.",
  "SystemAlertHost": "Browser preview only: stands in for the iOS permission alert.",
  "RecordDial": "The record button in a ring of ticks. Tap to start.",
  "ListeningRing": "Stop button inside bars that move with the sound level.",
  "TipCarousel": "A few one-line tips in a light frosted box, one at a time; swipe or tap the dashes.",
  "MonthCalendar": "A month of nights, each ringed by its Sound Score; ‹ › for months, tap the title for a month and year grid.",
  "SnoringChart": "The night’s sound level against a dB scale, with events marked above. Overview: tap to pick a moment. Explore: playhead, zoom.",
  "NightTimeline": "Snoring bars, breathing ticks and an asleep line across the night; optional clip rings.",
  "ScoreRing": "Ring filled to a fraction, with an icon or number inside.",
  "BenchmarkScale": "Bar of named zones, with markers for tonight and your usual.",
  "RampFill": "Fills a bar with the loudness ramp up to the colour its value reaches, like the score rings.",
  "HourlyBars": "Minutes or counts per hour of the night.",
  "LoudnessBars": "How snoring split by loudness.",
  "RecentNightsChart": "Last 7 nights as bars, with a line at your usual.",
  "ComparisonIndicator": "Trend arrow with words: more, about or less than usual.",
  "ClipPlayer": "Large clip player: waveform with pause and loud-breath marks, scrubber, play/pause.",
  "AudioSnippet": "Compact clip row with play/pause and a small waveform.",
  "PrivacyFooter": "“Private by default” page footer: a large lock and one line."
};

const GROUPS = [
  ['Foundations', [['AppText'], ['Icon'], ['Logo']]],
  ['Page structure and templates', [['PageTitle'], ['DetailPage'], ['PromptLayout'], ['AmbientGradient'], ['TabBar'], ['Screen']]],
  ['Buttons and controls', [['Button'], ['IconButton'], ['InfoButton'], ['Avatar'], ['ToggleChip', 'ToggleChip'], ['ChipGroup', 'ToggleChip'], ['IconChoiceGrid'], ['SettingSwitch', 'SettingRows'], ['SegmentedControl']]],
  ['Forms and rows', [['FormGroup', 'Form'], ['FormTitle', 'Form'], ['FormInput', 'Form'], ['FormDivider', 'Form'], ['PhoneField'], ['Checkbox'], ['WheelPicker', 'Pickers'], ['RulerPicker', 'Pickers'], ['AboutYou'], ['SettingRow', 'SettingRows']]],
  ['Cards', [['Card'], ['VerdictCard'], ['InsightCard'], ['DataCard'], ['BigNumber', 'DataCard'], ['ScoreTile']]],
  ['Sheets and feedback', [['BottomSheet'], ['TopSheet'], ['ExplainSheet'], ['LargeSheet'], ['PermissionSheet'], ['Toast'], ['SystemAlertHost']]],
  ['Recording', [['RecordDial'], ['ListeningRing'], ['TipCarousel']]],
  ['Reports', [['MonthCalendar']]],
  ['Data visualisation', [['SnoringChart'], ['NightTimeline'], ['ScoreRing'], ['RampFill'], ['BenchmarkScale'], ['HourlyBars'], ['LoudnessBars'], ['RecentNightsChart'], ['ComparisonIndicator']]],
  ['Audio', [['ClipPlayer'], ['AudioSnippet']]],
  ['Recording Details parts', [['PrivacyFooter']]],
];
const components = GROUPS.map(([group, items]) => ({
  group,
  items: items.map(([name, file = name]) => {
    const shared = `design-system/components/${file}.tsx`;
    const path = shared in sources ? shared : `${APP}/src/components/${file}.tsx`;
    const src = sources[path] ?? '';
    return { name, path, doc: BLURB[name] ?? docOf(src, name), used: usedIn(name) };
  }),
}));

// Logo: white paths; drawn in currentColor so the page can tint it.
const logo = (file) => read(`${APP}/assets/brand/${file}`).replace(/fill="white"/g, 'fill="currentColor"').replace(/<svg /, '<svg aria-hidden="true" ');

// ---------- Copy images ----------

mkdirSync(join(out, 'img'), { recursive: true });
const IMAGES = [
  'onboarding/1-hear.jpg', 'onboarding/2-private.jpg', 'onboarding/3-pattern.jpg',
  'permissions/microphone.png', 'permissions/notifications.png', 'prompts/update.png',
  'problems/space.png', 'problems/start.png', 'problems/faint.png', 'problems/stopped.png', 'problems/app-closed.png',
  'icon.png', 'android-icon-foreground.png', 'android-icon-background.png', 'android-icon-monochrome.png',
];
for (const img of IMAGES) copyFileSync(join(root, APP, 'assets', img), join(out, 'img', basename(img)));

// Logos on a Midnight tile for the README (white logos vanish on GitHub's light theme).
mkdirSync(join(root, 'design-system/img'), { recursive: true });
const tile = (file, w, h, pad) => {
  const svg = read(`${APP}/assets/brand/${file}`);
  const [, vw, vh] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${Number(vw) + pad * 2} ${Number(vh) + pad * 2}"><rect width="100%" height="100%" rx="${pad / 2}" fill="#0B1020"/><g transform="translate(${pad} ${pad})">${inner}</g></svg>`;
};
writeFileSync(join(root, 'design-system/img/logo-stacked.svg'), tile('airese-logo.svg', 160, 160, 24));
const hv = read(`${APP}/assets/brand/airese-logo-hori.svg`).match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
writeFileSync(join(root, 'design-system/img/logo-horizontal.svg'), tile('airese-logo-hori.svg', 260, Math.round((260 * (Number(hv[2]) + 48)) / (Number(hv[1]) + 48)), 24));

// Swatches for design-system/README.md, written from the tokens on every run (so they can't drift).
mkdirSync(join(root, 'design-system/swatches'), { recursive: true });
const kebab = (n) => n.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
const chipSvg = (fill) => `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="28" viewBox="0 0 56 28"><rect width="56" height="28" rx="6" fill="#0B1020"/><rect x="0.5" y="0.5" width="55" height="27" rx="6" fill="${fill}" stroke="#8892a6" stroke-opacity="0.5"/></svg>`;
const gradSvg = (stops, w = 56, vertical = true) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="28"><defs><linearGradient id="g"${vertical ? ' x1="0" y1="0" x2="0" y2="1"' : ''}>${stops.map((x) => `<stop offset="${x.offset}" stop-color="${x.color}"/>`).join('')}</linearGradient></defs><rect x="0.5" y="0.5" width="${w - 1}" height="27" rx="6" fill="url(#g)" stroke="#8892a6" stroke-opacity="0.5"/></svg>`;
for (const p of palette) writeFileSync(join(root, `design-system/swatches/${kebab(p.name)}.svg`), chipSvg(p.hex));
for (const c of colorLines) if (!hexOf[c.name]) writeFileSync(join(root, `design-system/swatches/${kebab(c.name)}.svg`), chipSvg(c.value));
for (const l of loudness) writeFileSync(join(root, `design-system/swatches/loud-${kebab(l.name)}.svg`), chipSvg(l.hex));
writeFileSync(join(root, 'design-system/swatches/loudness-ramp.svg'), gradSvg(loudness.map((l, i) => ({ offset: i / (loudness.length - 1), color: l.hex })), 200, false));
for (const g of gradients) writeFileSync(join(root, `design-system/swatches/gradient-${kebab(g.name)}.svg`), gradSvg(g.stops));

// ---------- Page ----------

const contrast = (hex) => {
  const lum = (h) => {
    const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const a = lum(hex);
  const b = lum('#0B1020');
  return ((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(1);
};

const swatch = (value, label, note, extra = '') => `
  <figure class="swatch">
    <div class="chip" style="background:${esc(value)}"></div>
    <figcaption><b>${esc(label)}</b><code>${esc(value)}</code>${extra}<span>${esc(note)}</span></figcaption>
  </figure>`;

const roles = colorLines.filter((c) => !hexOf[c.name] || c.name !== c.ref);
const nav = [
  ['colour', 'Colour'],
  ['type', 'Typography'],
  ['space', 'Spacing and corners'],
  ['motion', 'Motion'],
  ['icons', 'Icons'],
  ['brand', 'Brand assets'],
  ['components', 'Components'],
  ['patterns', 'Patterns'],
  ['a11y', 'Accessibility'],
];

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Airese Design System</title>
<meta name="description" content="Tokens, type, motion, icons, brand assets and React Native components used to build Airese.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Montserrat:wght@400;600&display=swap" rel="stylesheet">
<style>
  :root { --night:#05070F; --midnight:#0B1020; --deep:#19294E; --mist:#B3BDD3; --moon:#EEF1F7; --breath:#9DB4FF; --lamp:#F4B65F; --line:rgba(179,189,211,.18); }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
  body { margin:0; background:var(--midnight); color:var(--moon); font:400 16px/1.6 Inter, system-ui, sans-serif; }
  h1,h2,h3,.title-font { font-family:Montserrat, system-ui, sans-serif; }
  a { color:var(--breath); }
  a:focus-visible, summary:focus-visible { outline:2px solid var(--breath); outline-offset:3px; border-radius:4px; }
  code { font:13px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; color:var(--mist); }
  h1,h2,h3 { font-weight:600; margin:0; }
  h1 { font-size:40px; line-height:1.15; }
  h2 { font-size:28px; line-height:1.25; margin-bottom:8px; }
  h3 { font-size:20px; line-height:1.4; margin:40px 0 12px; }
  p { margin:0 0 12px; }
  .muted { color:var(--mist); }
  .wrap { max-width:1120px; margin:0 auto; padding:0 16px; }
  header.top { padding:56px 0 40px; border-bottom:1px solid var(--line); }
  header.top .brand { display:flex; align-items:center; gap:20px; margin-bottom:28px; color:var(--moon); }
  header.top .brand svg { width:64px; height:auto; }
  header.top .lead { font-size:18px; max-width:720px; color:var(--mist); }
  .links { display:flex; flex-wrap:wrap; gap:8px 20px; margin-top:20px; font-size:14px; }
  nav.toc { position:sticky; top:0; z-index:5; background:rgba(11,16,32,.92); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border-bottom:1px solid var(--line); }
  nav.toc ul { list-style:none; margin:0; padding:0 16px; display:flex; gap:4px; overflow-x:auto; max-width:1120px; margin:0 auto; scrollbar-width:none; }
  nav.toc a { display:block; padding:12px 12px; min-height:44px; color:var(--mist); text-decoration:none; font-size:14px; white-space:nowrap; }
  nav.toc a:hover { color:var(--moon); }
  section { padding:64px 0 24px; border-bottom:1px solid var(--line); scroll-margin-top:48px; }
  .rules { display:grid; gap:12px; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); margin-top:24px; }
  .rule { background:var(--deep); border-radius:16px; padding:16px 20px; font-size:14px; }
  .rule b { display:block; font-size:16px; margin-bottom:4px; }
  .grid { display:grid; gap:16px; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); }
  .swatch { margin:0; background:var(--deep); border-radius:16px; overflow:hidden; }
  .swatch .chip { height:88px; border-bottom:1px solid var(--line); }
  .swatch figcaption { padding:12px 16px 16px; display:flex; flex-direction:column; gap:2px; font-size:14px; }
  .swatch figcaption span { color:var(--mist); }
  .swatch .ratio { font-size:12px; color:var(--mist); }
  .ramp { display:flex; border-radius:12px; overflow:hidden; height:56px; margin:8px 0 12px; }
  .ramp div { flex:1; }
  table { width:100%; border-collapse:collapse; font-size:14px; }
  th, td { text-align:left; padding:12px 12px; border-bottom:1px solid var(--line); vertical-align:top; }
  th { color:var(--mist); font-weight:400; font-size:12px; text-transform:uppercase; letter-spacing:1px; }
  .scroll { overflow-x:auto; }
  .specimen td:first-child { white-space:nowrap; }
  .space-bar { height:16px; background:var(--breath); border-radius:4px; }
  .radius-box { width:72px; height:72px; background:var(--deep); border:1px solid var(--breath); }
  .demo { display:flex; align-items:center; gap:16px; }
  .track { position:relative; height:44px; background:var(--deep); border-radius:999px; flex:1; overflow:hidden; }
  .dot { position:absolute; top:8px; left:8px; width:28px; height:28px; border-radius:50%; background:var(--breath); }
  .demo button { min-height:44px; padding:0 20px; border-radius:999px; border:0; background:var(--breath); color:var(--midnight); font:400 16px Montserrat, sans-serif; cursor:pointer; }
  .icons { display:grid; gap:8px; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); }
  .icon { background:var(--deep); border-radius:12px; padding:16px 8px 12px; text-align:center; }
  .icon svg { width:32px; height:32px; fill:var(--moon); }
  .icon code { display:block; margin-top:8px; font-size:11.5px; word-break:break-all; }
  .logos { display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); }
  .logo-tile { border-radius:16px; padding:40px 24px; display:flex; align-items:center; justify-content:center; min-height:200px; }
  .logo-tile svg { width:100%; height:auto; display:block; }
  .images { display:grid; gap:16px; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); }
  .images figure { margin:0; }
  .images img { width:100%; border-radius:16px; display:block; background:var(--deep); }
  /* App icons, as each platform shows them */
  .appicons { display:flex; flex-wrap:wrap; gap:24px 32px; align-items:flex-start; }
  .appicons figure { margin:0; width:120px; }
  .appicons figcaption { margin-top:8px; font-size:13px; color:var(--mist); }
  .appicons .group { display:flex; flex-direction:column; gap:12px; }
  .appicons .group > b { font-size:14px; }
  .appicons .row { display:flex; flex-wrap:wrap; gap:16px; }
  .ai { width:120px; height:120px; display:block; overflow:hidden; }
  .ai.ios { border-radius:22.37%; }
  /* Android adaptive: background and foreground stacked; the launcher shows the middle 72/108, so draw them at 150% */
  .ai.android { background-image:url(img/android-icon-foreground.png), url(img/android-icon-background.png); background-size:150%, 150%; background-position:center, center; }
  .ai.themed { background-image:url(img/android-icon-monochrome.png); background-size:150%; background-position:center; background-color:#3C465A; border-radius:50%; }
  .ai.circle { border-radius:50%; }
  .ai.squircle { border-radius:32%; }
  .ai.rounded { border-radius:14%; }
  .ai.teardrop { border-radius:50% 50% 50% 14%; }
  .images figcaption { font-size:14px; color:var(--mist); margin-top:8px; }
  .comp-group { margin-top:40px; }
  .comps { display:grid; gap:12px; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); }
  details.comp { background:var(--deep); border-radius:16px; padding:0 20px; }
  details.comp summary { cursor:pointer; list-style:none; padding:16px 0; min-height:44px; display:flex; justify-content:space-between; gap:12px; align-items:baseline; }
  details.comp summary::-webkit-details-marker { display:none; }
  details.comp summary b { font-size:16px; }
  details.comp summary span { font-size:12px; color:var(--mist); text-align:right; }
  details.comp[open] summary { border-bottom:1px solid var(--line); }
  details.comp .blurb { font-size:14px; margin:12px 0; }
  details.comp .meta { font-size:13px; color:var(--mist); padding-bottom:16px; }
  .tag { display:inline-block; font-size:12px; padding:2px 10px; border-radius:999px; background:rgba(244,182,95,.12); color:var(--lamp); margin-left:6px; }
  footer { padding:56px 0 72px; text-align:center; color:var(--mist); font-size:14px; }
  footer svg { width:48px; height:auto; color:var(--mist); display:block; margin:0 auto 16px; }
  @media (max-width:600px) { h1 { font-size:32px; } h2 { font-size:24px; } section { padding:48px 0 16px; } .comps { grid-template-columns:1fr; } }
</style>
</head>
<body>
<header class="top">
  <div class="wrap">
    <div class="brand">${logo('airese-logo.svg')}<div><div class="muted" style="font-size:14px">Airese by Easmed · powered by The Air Station</div><h1>Design system</h1></div></div>
    <p class="lead">Colour, type, spacing, motion, icons, brand assets and React Native components used in the Airese app. Generated from the code.</p>
    <div class="links">
      <a href="../v2/">Open the prototype</a>
      <a href="${REPO}/design-system/docs/BRAND.md">Brand brief</a>
      <a href="https://github.com/AUD-NCO/easmed/tree/main/The%20Air%20Station/Airese/design-system">This page on GitHub</a>
    </div>
    <div class="rules">
      <div class="rule"><b>Tokens only</b>No hard-coded colours, sizes, timings or curves.</div>
      <div class="rule"><b>One text, one icon</b>Text through <code>AppText</code>, icons through <code>Icon</code>.</div>
      <div class="rule"><b>Two motion presets</b><code>slow</code> and <code>fast</code>. Reduce Motion respected.</div>
      <div class="rule"><b>WCAG 2.2 AAA</b>7:1 text, 44 pt targets, 12 pt minimum.</div>
    </div>
  </div>
</header>

<nav class="toc" aria-label="Sections"><ul>${nav.map(([id, label]) => `<li><a href="#${id}">${label}</a></li>`).join('')}</ul></nav>

<main class="wrap">

<section id="colour">
  <h2>Colour</h2>
  <p class="muted">Dark UI with one warm accent. One red, Flare: form errors and the loudest snoring in charts, plus one coral button (<code>urgentAction</code>, Book a call on a repeated pattern). See-through tints are written <code>alpha(colors.x, 0.16)</code>. Contrast ratios are against Midnight.</p>
  <h3>Palette</h3>
  <div class="grid">${palette.map((p) => swatch(p.hex, p.name[0].toUpperCase() + p.name.slice(1), p.note, Number(contrast(p.hex)) >= 3 ? `<span class="ratio">${contrast(p.hex)}:1 on Midnight</span>` : '')).join('')}</div>
  <h3>Roles and special colours</h3>
  <div class="grid">${roles.map((c) => swatch(c.value, c.name, c.note || (c.ref ? `= ${c.ref}` : ''))).join('')}</div>
  <h3>Loudness ramp</h3>
  <p class="muted">Snoring loudness, quiet to very loud: cyan, yellow, orange, red. Charts and graphs only, never text or UI.</p>
  <div class="ramp" role="img" aria-label="Loudness ramp from quiet to very loud">${loudness.map((l) => `<div style="background:${l.hex}"></div>`).join('')}</div>
  <div class="grid">${loudness.map((l) => swatch(l.hex, l.name, '')).join('')}</div>
  <h3>Gradients</h3>
  <div class="grid">${gradients
    .map((g) =>
      swatch(
        `linear-gradient(180deg, ${g.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(', ')})`,
        g.name,
        g.name === 'splash' ? 'Splash, Home, Recording, record button' : g.name === 'hero' ? 'Verdict card, ordinary night' : g.name === 'heroWatch' ? 'Verdict card, unusual night' : 'Verdict card, repeated pattern',
      ),
    )
    .join('')}</div>
  <h3>Verdict moods</h3>
  <p class="muted">The verdict card on a report: card colours, the graph behind the words, and the one button.</p>
  <div class="scroll"><table><thead><tr><th>Night</th><th>Card</th><th>Graph line</th><th>Button</th></tr></thead><tbody>
    <tr><td>Ordinary, first night</td><td><code>gradients.hero</code></td><td>Breath, low and nearly flat</td><td>Keep tracking · Breath</td></tr>
    <tr><td>Unusual</td><td><code>gradients.heroWatch</code></td><td>Lamp, climbing to tonight</td><td>Try using a remedy · Lamp</td></tr>
    <tr><td>Repeated pattern</td><td><code>gradients.heroUrgent</code></td><td>Flare, a drawn climb across the card</td><td>Book a call · <code>urgentAction</code></td></tr>
  </tbody></table></div>
  <p class="muted" style="margin-top:12px">Behind the words the graph stays within a readability budget: Moon body text keeps 7:1 or more at the card's brightest point.</p>
</section>

<section id="type">
  <h2>Typography</h2>
  <p class="muted">Montserrat for titles and buttons; Inter for everything you read. Regular (400) and semibold (600) only. 12 pt minimum. Scales to 200% with system text size.</p>
  <div class="scroll"><table class="specimen"><thead><tr><th>Variant</th><th>Sample</th><th>Font</th><th>Size / line</th><th>Weight</th><th>Use</th></tr></thead><tbody>
  ${typeScale.map((t) => `<tr><td><code>${t.name}</code></td><td style="font-family:${t.family}, system-ui, sans-serif;font-size:${t.size}px;line-height:${t.lh}px;font-weight:${t.weight}">You snored for 42 minutes</td><td>${t.family}</td><td>${t.size} / ${t.lh}</td><td>${t.weight}</td><td class="muted">${esc(t.note)}</td></tr>`).join('')}
  </tbody></table></div>
  <p class="muted" style="margin-top:16px">Durations: “7h 36m”. Times use tabular figures. Form group titles: uppercase, 1 pt tracking.</p>
</section>

<section id="space">
  <h2>Spacing and corners</h2>
  <h3>Spacing (4-pt grid)</h3>
  <div class="scroll"><table><tbody>${space.map((s) => `<tr><td style="width:120px"><code>space.${s.name}</code></td><td style="width:60px">${s.value}</td><td><div class="space-bar" style="width:${s.value * 4}px"></div></td><td class="muted">${esc(s.note)}</td></tr>`).join('')}</tbody></table></div>
  <h3>Corners</h3>
  <div class="grid">${radius.map((r) => `<figure class="swatch" style="padding:20px;display:flex;gap:16px;align-items:center"><div class="radius-box" style="border-radius:${Math.min(r.value, 36)}px"></div><figcaption style="padding:0"><b>radius.${r.name}</b><code>${r.value}</code><span>${esc(r.note)}</span></figcaption></figure>`).join('')}</div>
  <h3>Layout</h3>
  <div class="scroll"><table><tbody>
    <tr><td>Screen edge</td><td>20 (<code>space.gutter</code>, <code>PAGE_SIDE</code>)</td></tr>
    <tr><td>Touch target</td><td>44 pt minimum. Buttons 48, icon buttons 56, rows 64</td></tr>
    <tr><td>Sticky top bar</td><td>44 pt below the status bar (<code>DetailPage</code>)</td></tr>
    <tr><td>Tab bar clearance</td><td>96 pt (<code>TAB_BAR_CLEARANCE</code>)</td></tr>
    <tr><td>Depth</td><td>No shadows. A soft glow on the record button and verdict card; frosted sticky bars; a soft shadow under the Recording tips box.</td></tr>
  </tbody></table></div>
</section>

<section id="motion">
  <h2>Motion</h2>
  <p class="muted">Two presets. No bounce or overshoot. Press a button to see the curve.</p>
  <div class="scroll"><table><thead><tr><th>Preset</th><th>Duration</th><th>easeOut (arriving)</th><th>easeIn (leaving)</th><th>easeInOut (between)</th></tr></thead><tbody>
  ${presets.map((p) => `<tr><td><code>motion.${p.name}</code></td><td>${p.duration} ms</td><td><code>${p.easeOut}</code></td><td><code>${p.easeIn}</code></td><td><code>${p.easeInOut}</code></td></tr>`).join('')}
  </tbody></table></div>
  <div style="display:grid;gap:12px;margin-top:20px">
  ${presets
    .flatMap((p) =>
      ['easeOut', 'easeInOut'].map(
        (k) => `<div class="demo"><button type="button" data-d="${p.duration}" data-e="cubic-bezier(${p[k]})" aria-label="Play ${p.name} ${k}">${p.name} · ${k}</button><div class="track"><div class="dot"></div></div></div>`,
      ),
    )
    .join('')}
  </div>
  <h3>Helpers</h3>
  <div class="scroll"><table><tbody>
    <tr><td><code>motion.ambient</code></td><td>${ambient} ms, sine in-out</td><td class="muted">Gradient drift, record button breathing</td></tr>
    <tr><td><code>motion.attention</code></td><td>${attention[1]} ms, then ${attention[2]} ms rest</td><td class="muted">Light that runs round the record ring</td></tr>
    <tr><td><code>motion.glint</code></td><td>${glint[1]} ms, then ${glint[2]} ms rest</td><td class="muted">A tiny shine that draws the verdict card's graph on load, then glides along it now and then</td></tr>
    <tr><td><code>motion.stagger</code></td><td>${stagger} ms</td><td class="muted">Delay between steps</td></tr>
  </tbody></table></div>
  <p class="muted" style="margin-top:16px">Reduce Motion: fades instead of slides, no loops, charts drawn at once.</p>
</section>

<section id="icons">
  <h2>Icons</h2>
  <p class="muted">Material Symbols, Outlined, weight 400, via <code>Icon</code>. <code>_fill</code> is the selected state. ${icons.length + healthIcons.length} in use; the last ${healthIcons.length} are Health Icons (healthicons.org), for what Material doesn't have. Tab bar: SF Symbols on iOS, Material on Android.</p>
  <div class="icons">${icons.map((i) => `<div class="icon"><svg viewBox="0 -960 960 960" aria-hidden="true"><path d="${i.d}"/></svg><code>${i.name}</code></div>`).join('')}${healthIcons.map((i) => `<div class="icon"><svg viewBox="0 0 48 48" aria-hidden="true">${i.paths.map((x) => `<path d="${x.d}"${x.evenodd ? ' fill-rule="evenodd" clip-rule="evenodd"' : ''}/>`).join('')}</svg><code>${i.name}</code></div>`).join('')}</div>
</section>

<section id="brand">
  <h2>Brand assets</h2>
  <h3>Logo</h3>
  <div class="logos">
    <div class="logo-tile" style="background:var(--midnight);border:1px solid var(--line);color:var(--moon)"><div style="width:110px">${logo('airese-logo.svg')}</div></div>
    <div class="logo-tile" style="background:linear-gradient(180deg,#0B1020,#1C3470 50%,#225ED8);color:#fff"><div style="width:110px">${logo('airese-logo.svg')}</div></div>
    <div class="logo-tile" style="background:var(--midnight);border:1px solid var(--line);color:var(--mist)"><div style="width:240px">${logo('airese-logo-hori.svg')}</div></div>
  </div>
  <p class="muted" style="margin-top:12px">Moon on dark, white on the splash gradient, Mist in footers. Horizontal logo not used yet. Files: <a href="${REPO}/v2/assets/brand/airese-logo.svg">airese-logo.svg</a>, <a href="${REPO}/v2/assets/brand/airese-logo-hori.svg">airese-logo-hori.svg</a>.</p>
  <h3>App icon and splash</h3>
  <p class="muted">The Airese mark in white on the splash gradient (Midnight to blue), 56% of the icon’s width. The icon’s mark has slightly thicker bars than the logo, so they stay visible at 29 pt. Native splash: plain Midnight, handing over to the animated splash screen. Play Store listing: <a href="${REPO}/v2/assets/store/play-store-512.png">play-store-512.png</a>.</p>
  <div class="appicons">
    <div class="group"><b>iOS · one icon</b>
      <div class="row">
        <figure><img class="ai ios" src="img/icon.png" alt="Airese app icon on iOS"><figcaption>icon.png, 1024, no transparency. iOS rounds the corners.</figcaption></figure>
      </div>
    </div>
    <div class="group"><b>Android · one adaptive icon, cut to the launcher’s shape</b>
      <div class="row">
        <figure><span class="ai android circle" role="img" aria-label="Android icon, circle"></span><figcaption>Circle (Pixel)</figcaption></figure>
        <figure><span class="ai android squircle" role="img" aria-label="Android icon, squircle"></span><figcaption>Squircle (Samsung)</figcaption></figure>
        <figure><span class="ai android rounded" role="img" aria-label="Android icon, rounded square"></span><figcaption>Rounded square</figcaption></figure>
        <figure><span class="ai android teardrop" role="img" aria-label="Android icon, teardrop"></span><figcaption>Teardrop</figcaption></figure>
        <figure><span class="ai themed" role="img" aria-label="Android themed icon"></span><figcaption>Themed (Android 13+), from the monochrome layer</figcaption></figure>
      </div>
    </div>
  </div>
  <p class="muted" style="margin-top:16px">Android files: <a href="${REPO}/v2/assets/android-icon-foreground.png">foreground</a>, <a href="${REPO}/v2/assets/android-icon-background.png">background</a>, <a href="${REPO}/v2/assets/android-icon-monochrome.png">monochrome</a>, all 1024; the mark stays inside the central safe zone, so every shape keeps it whole.</p>
  <h3>Illustrations</h3>
  <p class="muted">One style for every prompt: glowing line art on a deep blue sphere, warm Lamp highlights. Shown at 200 pt.</p>
  <div class="images">
    <figure><img src="img/1-hear.jpg" alt="" loading="lazy"><figcaption>Onboarding 1: Record your sleep with just your phone</figcaption></figure>
    <figure><img src="img/2-private.jpg" alt="" loading="lazy"><figcaption>Onboarding 2: Private. Recordings stay on your phone</figcaption></figure>
    <figure><img src="img/3-pattern.jpg" alt="" loading="lazy"><figcaption>Onboarding 3: Know when it’s worth getting checked</figcaption></figure>
    <figure><img src="img/microphone.png" alt="" loading="lazy"><figcaption>Microphone permission</figcaption></figure>
    <figure><img src="img/notifications.png" alt="" loading="lazy"><figcaption>Notifications permission</figcaption></figure>
    <figure><img src="img/update.png" alt="" loading="lazy"><figcaption>App update</figcaption></figure>
    <figure><img src="img/space.png" alt="" loading="lazy"><figcaption>Not enough space (and space ran out)</figcaption></figure>
    <figure><img src="img/start.png" alt="" loading="lazy"><figcaption>Couldn’t start recording</figcaption></figure>
    <figure><img src="img/faint.png" alt="" loading="lazy"><figcaption>Couldn’t hear clearly</figcaption></figure>
    <figure><img src="img/stopped.png" alt="" loading="lazy"><figcaption>Stopped in the night</figcaption></figure>
    <figure><img src="img/app-closed.png" alt="" loading="lazy"><figcaption>Paused: another app closed Airese</figcaption></figure>
  </div>
  <h3>Fonts</h3>
  <p>Montserrat via <code>@expo-google-fonts/montserrat</code> and Inter via <code>@expo-google-fonts/inter</code>, 400 and 600 of each.</p>
</section>

<section id="components">
  <h2>Components</h2>
  <p class="muted">${components.reduce((n, g) => n + g.items.length, 0)} components in <code>design-system/components/</code> (shared by v1 and v2) and each version’s <code>src/components/</code>. Open one for details and where it’s used.</p>
  ${components
    .map(
      (g) => `<div class="comp-group"><h3>${g.group}</h3><div class="comps">${g.items
        .map(
          (c) => `<details class="comp"><summary><b>${c.name}${c.used.length ? '' : '<span class="tag">not used</span>'}</b><span>${c.used.length ? esc(c.used.slice(0, 3).join(', ')) + (c.used.length > 3 ? ` +${c.used.length - 3}` : '') : ''}</span></summary>
          <p class="blurb">${esc(c.doc || '—')}</p>
          <div class="meta">Used in: ${c.used.length ? esc(c.used.join(', ')) : 'nothing yet'}<br><a href="${REPO}/${c.path}">${c.path}</a></div></details>`,
        )
        .join('')}</div></div>`,
    )
    .join('')}
</section>

<section id="patterns">
  <h2>Patterns</h2>
  <div class="scroll"><table><tbody>
    <tr><td>Levels of detail</td><td>Page → small sheet for “why?” → large sheet for “more”.</td></tr>
    <tr><td>Pages from a row</td><td><code>DetailPage</code>. Back names where it goes.</td></tr>
    <tr><td>Grouped settings</td><td><code>FormGroup</code> with inputs, rows or switches.</td></tr>
    <tr><td>Editing</td><td>Changes save on Save; Back discards them.</td></tr>
    <tr><td>Destructive actions</td><td>Confirm in a sheet, then a toast.</td></tr>
    <tr><td>Permissions</td><td>Ask in onboarding; ask again in context with <code>PermissionSheet</code>.</td></tr>
    <tr><td>Empty states</td><td>Heading, one sentence on what to do, one action.</td></tr>
    <tr><td>Charts</td><td>A sentence above each chart. Shapes in legends. A text alternative.</td></tr>
    <tr><td>Numbers</td><td>No small units. Levels are words, not colour alone.</td></tr>
    <tr><td>One message</td><td>Home shows one banner message at a time, by priority, with its action under the text.</td></tr>
    <tr><td>Tabs</td><td>Every tab's page uses <code>PageTitle</code>'s row: same title, position and glassy control.</td></tr>
    <tr><td>Graphs behind text</td><td>Everything behind the words must leave body text at 7:1 or more; strengthen the graph only where there's no text.</td></tr>
    <tr><td>Brand</td><td>Logo in Mist with “Powered by The Air Station” on the splash and at the end of Profile and Our centres.</td></tr>
  </tbody></table></div>
</section>

<section id="a11y">
  <h2>Accessibility</h2>
  <div class="rules">
    <div class="rule"><b>Contrast</b>7:1 for text, 3:1 for data marks.</div>
    <div class="rule"><b>Targets</b>44 pt minimum for every control.</div>
    <div class="rule"><b>Text size</b>12 pt minimum; scales to 200%.</div>
    <div class="rule"><b>Not colour alone</b>Words for levels, shapes for chart events.</div>
    <div class="rule"><b>Gestures</b>One-finger alternative for every gesture.</div>
    <div class="rule"><b>Motion</b>Reduce Motion respected.</div>
  </div>
</section>

</main>

<footer>
  ${logo('airese-logo.svg')}
  Powered by The Air Station<br>
  <span style="font-size:12px">Generated from the source on ${new Date().toISOString().slice(0, 10)}</span>
</footer>

<script>
  // Motion demos: move the dot with the real preset's duration and curve (skipped with Reduce Motion).
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.demo button').forEach((b) => b.addEventListener('click', () => {
    const dot = b.nextElementSibling.firstElementChild;
    const end = b.nextElementSibling.clientWidth - 44;
    const at = dot.dataset.at === '1';
    if (still) { dot.style.transform = 'translateX(' + (at ? 0 : end) + 'px)'; dot.dataset.at = at ? '0' : '1'; return; }
    dot.animate([{ transform: 'translateX(' + (at ? end : 0) + 'px)' }, { transform: 'translateX(' + (at ? 0 : end) + 'px)' }], { duration: +b.dataset.d, easing: b.dataset.e, fill: 'forwards' });
    dot.dataset.at = at ? '0' : '1';
  }));
</script>
</body>
</html>`;

// Images keep their names across versions, so tag each with a hash of its contents: a changed image always reloads.
const fingerprint = (file) => createHash('sha1').update(readFileSync(join(out, 'img', file))).digest('hex').slice(0, 8);
writeFileSync(join(out, 'index.html'), html.replace(/img\/([\w.-]+\.(?:png|jpg|svg))/g, (m, file) => `${m}?v=${fingerprint(file)}`));
console.log(`Design system written to preview-dist/design-system/index.html (${(html.length / 1024).toFixed(0)} KB, ${icons.length} icons, ${components.reduce((n, g) => n + g.items.length, 0)} components)`);
