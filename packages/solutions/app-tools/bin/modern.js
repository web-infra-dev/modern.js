#!/usr/bin/env node
const { INTERNAL_RUNTIME_PLUGINS } = require('@modern-js/utils');

const { version } = require('../package.json');

if (!process.env.MODERN_JS_VERSION) {
  process.env.MODERN_JS_VERSION = version;
}

// is esm project?
let isEsm = false;
try {
  const { readFileSync } = require('fs');
  const { join } = require('path');
  const { cwd } = require('process');
  const pkg = JSON.parse(
    readFileSync(join(cwd(), 'package.json'), { encoding: 'utf-8' }),
  );
  isEsm = pkg.type === 'module';
} catch (e) {
  // ignore
}

require(
  isEsm ? '../dist/esm-node/run/index.mjs' : '../dist/cjs/run/index.js',
).run({
  internalPlugins: INTERNAL_RUNTIME_PLUGINS,
  version,
});
