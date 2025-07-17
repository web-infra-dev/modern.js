#!/usr/bin/env node
const { INTERNAL_RUNTIME_PLUGINS } = require('@modern-js/utils');

const { version } = require('../package.json');

if (!process.env.MODERN_JS_VERSION) {
  process.env.MODERN_JS_VERSION = version;
}

require('../dist/cjs/run/index.js').run({
  internalPlugins: INTERNAL_RUNTIME_PLUGINS,
  version,
});
