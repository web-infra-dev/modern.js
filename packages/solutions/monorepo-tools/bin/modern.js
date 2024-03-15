#!/usr/bin/env node

const { version } = require('../package.json');

if (!process.env.MODERN_JS_VERSION) {
  process.env.MODERN_JS_VERSION = version;
}

require('@modern-js/core/runBin').run({
  initialLog: `Modern.js Monorepo v${version}`,
});
