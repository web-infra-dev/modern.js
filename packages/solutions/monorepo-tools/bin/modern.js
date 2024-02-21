#!/usr/bin/env node

const { version } = require('../package.json');

process.env.MODERN_JS_VERSION = version;

require('@modern-js/core/runBin').run({
  initialLog: `Modern.js Monorepo v${version}`,
});
