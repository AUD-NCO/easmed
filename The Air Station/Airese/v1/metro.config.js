// Also watch the shared design system (../design-system, imported as @ds/...): it isn't a workspace
// package, so Expo's monorepo setup doesn't watch it, and edits there wouldn't reload.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.watchFolders = [...config.watchFolders, path.resolve(__dirname, '../design-system')];

module.exports = config;
