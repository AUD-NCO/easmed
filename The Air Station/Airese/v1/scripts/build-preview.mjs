/**
 * Builds one self-contained HTML file of the app inside the iPhone 17 Pro frame,
 * for sharing as a link. Reuses the frame from public/iphone.html.
 * For day-to-day work use localhost instead: `npx expo start --web`, then /iphone.html.
 *
 *   npm run preview  →  Airese/preview-dist/<v1|v2>/index.html (this folder's name)
 * The shared design system page is built separately: npm run design-system, from Airese/.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';

const root = decodeURIComponent(new URL('..', import.meta.url).pathname);
const version = basename(root);
const tmp = join(root, '.preview-build');
const out = join(root, '..', 'preview-dist', version);

rmSync(tmp, { recursive: true, force: true });
execSync(`npx expo export --platform web --output-dir "${tmp}"`, {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, EXPO_PUBLIC_PREVIEW: '1', NODE_ENV: 'production' },
});

const jsDir = join(tmp, '_expo/static/js/web');
let bundle = readdirSync(jsDir)
  .filter((f) => f.endsWith('.js'))
  .map((f) => readFileSync(join(jsDir, f), 'utf8'))
  .join('\n')
  .replace(/<\/script/gi, '<\\/script');

// Embed images and fonts as data URIs so the preview is one file that works from any URL.
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.otf': 'font/otf' };
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
const assetsDir = join(tmp, 'assets');
if (existsSync(assetsDir)) {
  for (const file of walk(assetsDir)) {
    const mime = MIME[extname(file).toLowerCase()];
    if (!mime) continue;
    const url = '/' + relative(tmp, file).split('\\').join('/');
    const dataUri = `data:${mime};base64,${readFileSync(file).toString('base64')}`;
    bundle = bundle.split(JSON.stringify(url)).join(JSON.stringify(dataUri));
  }
}

const html = readFileSync(join(root, 'public/iphone.html'), 'utf8')
  .replace(
    '<iframe id="app" title="Airese app"></iframe>',
    '<div id="root" style="position:absolute;inset:0;display:flex;flex-direction:column;overflow:hidden"></div>',
  )
  .replace(
    "document.getElementById('app').src = small ? '/' : '/?frame=iphone';",
    'window.__AIRESE_PREVIEW_INSETS__ = small ? undefined : { top: 62, bottom: 34, left: 0, right: 0 };',
  )
  .replace('</body>', () => `<script>${bundle}</script>\n</body>`);

mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), html);
// The email template, published next to the app (the mail app in the preview shows it). Opened as a
// file, the app can't reach inside the email, so this copy copies the code itself on Copy OTP and
// tells the app (components/MailDemo). The template stays script-free for email clients.
const copyOtp = `<script>
document.addEventListener('click', function (e) {
  var link = e.target.closest('a');
  if (!link) return;
  e.preventDefault();
  var code = new URL(link.href).searchParams.get('code') || '';
  var box = document.createElement('textarea');
  box.value = code;
  document.body.appendChild(box);
  box.select();
  document.execCommand('copy');
  box.remove();
  parent.postMessage({ source: 'airese-mail', action: 'copied', code: code }, '*');
});
</script>`;
writeFileSync(join(out, 'email-code.html'), readFileSync(join(root, 'public', 'email-code.html'), 'utf8').replace('</body>', () => `${copyOtp}\n</body>`));
rmSync(tmp, { recursive: true, force: true });
console.log(`\nPreview written to Airese/preview-dist/${version}/index.html (${(html.length / 1024).toFixed(0)} KB)`);
