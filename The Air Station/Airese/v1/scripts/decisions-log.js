/**
 * POST /__decisions: appends one person's answers from public/decisions.html to docs/DECISIONS-LOG.md,
 * headed with their name and the date and time. Submissions from Kedar are not logged.
 * Dev server only (wired in metro.config.js); the published preview has no server, so the page
 * offers a download instead.
 */
const fs = require('fs');
const path = require('path');

const LOG = path.resolve(__dirname, '../docs/DECISIONS-LOG.md');
const HEADER =
  '# Airese decisions log\n\n' +
  'Answers from the Decisions to make page (iphone.html → For the team), one entry per submission, newest last. ' +
  'Submissions from Kedar are not logged.\n';

function send(res, status, json) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(json));
}

function decisionsLog(req, res) {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 200000) req.destroy();
  });
  req.on('end', () => {
    let data;
    try {
      data = JSON.parse(body);
    } catch {
      return send(res, 400, { error: 'Not JSON' });
    }
    const name = String(data.name || '').replace(/[\r\n#*_`>|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
    const entry = String(data.markdown || '').trim();
    if (!name || !entry) return send(res, 400, { error: 'Name and answers are required' });
    if (name.split(' ')[0].toLowerCase() === 'kedar') return send(res, 200, { logged: false, reason: 'kedar' });

    const when = new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
    if (!fs.existsSync(LOG)) fs.writeFileSync(LOG, HEADER);
    fs.appendFileSync(LOG, `\n---\n\n## ${name} · ${when}\n\n${entry}\n`);
    send(res, 200, { logged: true, file: 'v1/docs/DECISIONS-LOG.md', when });
  });
}

module.exports = { decisionsLog };
