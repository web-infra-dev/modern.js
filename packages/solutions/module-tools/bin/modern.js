#!/usr/bin/env node
const { INTERNAL_MODULE_TOOLS_PLUGINS } = require('@modern-js/utils');

const { version } = require('../package.json');

process.env.MODERN_JS_VERSION = version;

require('@modern-js/core/runBin').run({
  internalPlugins: {
    cli: INTERNAL_MODULE_TOOLS_PLUGINS,
  },
  initialLog: `Modern.js Module v${version}`,
});
