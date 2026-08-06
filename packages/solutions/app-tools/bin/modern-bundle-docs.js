#!/usr/bin/env node
// The CLI body lives in the compiled ESM output; a CommonJS shim keeps the
// shebang and stays executable on any Node without a loader.
const path = require('path');
import('../dist/esm-node/bundleDocs.mjs').then(m =>
  m.runBundleDocsCli(path.resolve(__dirname, '..')),
);
