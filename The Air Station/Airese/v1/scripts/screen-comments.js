/**
 * GET /__comments: every screen's comments. POST /__comments: adds one, from the comment box beside
 * the phone in public/iphone.html. Saved to docs/SCREEN-COMMENTS.json, keyed by screen, oldest first.
 * Dev server only (wired in metro.config.js); the shared preview keeps comments in the browser.
 */
const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '../docs/SCREEN-COMMENTS.json');

function send(res, status, json) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(json));
}

function read() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return {};
  }
}

function screenComments(req, res) {
  if (req.method === 'GET') return send(res, 200, read());
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 50000) req.destroy();
  });
  req.on('end', () => {
    let data;
    try {
      data = JSON.parse(body);
    } catch {
      return send(res, 400, { error: 'Not JSON' });
    }
    const screen = String(data.screen || '').replace(/[^a-z0-9-]/g, '');
    const name = String(data.name || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    const text = String(data.text || '').trim().slice(0, 5000);
    if (!screen || !name || !text) return send(res, 400, { error: 'Screen, name and comment are required' });

    const all = read();
    const when = new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    (all[screen] = all[screen] || []).push({ name, text, when, screen: String(data.label || screen).slice(0, 80), at: new Date().toISOString() });
    fs.writeFileSync(FILE, JSON.stringify(all, null, 2) + '\n');
    send(res, 200, all);
  });
}

module.exports = { screenComments };
