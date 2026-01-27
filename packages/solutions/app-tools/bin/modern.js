#!/usr/bin/env node
const { INTERNAL_RUNTIME_PLUGINS } = require('@modern-js/utils');

const { version } = require('../package.json');

if (!process.env.MODERN_JS_VERSION) {
  process.env.MODERN_JS_VERSION = version;
}

// is esm project?
let isESM = false;
try {
  const { readFileSync } = require('fs');
  const { join } = require('path');
  const { cwd } = require('process');
  const pkg = JSON.parse(
    readFileSync(join(cwd(), 'package.json'), { encoding: 'utf-8' }),
  );
  isESM = pkg.type === 'module';
} catch (e) {
  // ignore
}

if (isESM) {
  import('../dist/esm-node/run/index.mjs').then(({ run }) => {
    run({
      internalPlugins: INTERNAL_RUNTIME_PLUGINS,
      version,
    });
  });
} else {
  require('../dist/cjs/run/index.js').run({
    internalPlugins: INTERNAL_RUNTIME_PLUGINS,
    version,
  });
}
