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

// `run()` prints a friendly message for lock conflicts and re-throws the
// typed error so its rejection semantics stay intact for programmatic
// callers; the bin just turns that known error into a silent exit code.
const onFatal = err => {
  if (err && err.name === 'DevServerLockError') {
    process.exit(process.exitCode || 1);
  }
  throw err;
};

if (isESM) {
  import('../dist/esm-node/run/index.mjs').then(({ run }) => {
    return run({
      internalPlugins: INTERNAL_RUNTIME_PLUGINS,
      version,
    }).catch(onFatal);
  });
} else {
  require('../dist/cjs/run/index.js')
    .run({
      internalPlugins: INTERNAL_RUNTIME_PLUGINS,
      version,
    })
    .catch(onFatal);
}
