// Also watch the shared design system (../design-system, imported as @ds/...): it isn't a workspace
// package, so Expo's monorepo setup doesn't watch it, and edits there wouldn't reload.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.watchFolders = [...config.watchFolders, path.resolve(__dirname, '../design-system')];

// Dev server only: public/decisions.html posts each person's answers here, to docs/DECISIONS-LOG.md.
const { decisionsLog } = require('./scripts/decisions-log');
const enhance = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const next = enhance ? enhance(middleware, server) : middleware;
    return (req, res, done) => (req.method === 'POST' && req.url === '/__decisions' ? decisionsLog(req, res) : next(req, res, done));
  },
};

module.exports = config;
