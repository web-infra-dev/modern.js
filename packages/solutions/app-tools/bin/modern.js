#!/usr/bin/env node
const {
  INTERNAL_APP_TOOLS_PLUGINS,
  INTERNAL_APP_TOOLS_RUNTIME_PLUGINS,
} = require('@modern-js/utils');

const { version } = require('../package.json');

if (!process.env.MODERN_JS_VERSION) {
  process.env.MODERN_JS_VERSION = version;
}

require('../dist/cjs/new/run.js').run({
  internalPlugins: {
    cli: INTERNAL_APP_TOOLS_PLUGINS,
    autoLoad: INTERNAL_APP_TOOLS_RUNTIME_PLUGINS,
  },
  version,
});
