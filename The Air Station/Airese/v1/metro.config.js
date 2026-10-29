// Also watch the shared design system (../design-system, imported as @ds/...): it isn't a workspace
// package, so Expo's monorepo setup doesn't watch it, and edits there wouldn't reload.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.watchFolders = [...config.watchFolders, path.resolve(__dirname, '../design-system')];

// Dev server only: the comment box beside the phone (public/iphone.html) reads and saves here, to docs/SCREEN-COMMENTS.json.
const { screenComments } = require('./scripts/screen-comments');
const enhance = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const next = enhance ? enhance(middleware, server) : middleware;
    return (req, res, done) => (req.url === '/__comments' ? screenComments(req, res) : next(req, res, done));
  },
};

module.exports = config;
