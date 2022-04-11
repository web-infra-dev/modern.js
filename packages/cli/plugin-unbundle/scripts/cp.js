const path = require('path');
const { fs } = require('@modern-js/utils');

const src = path.resolve(__dirname, '../src/client');
const dist = path.resolve(__dirname, '../dist/client');

const JS_EXT_REGEXP = /\.(mjs|cjs|js|jsx)$/;

fs.copy(
  src,
  dist,
  {
    recursive: true,
    filter: filename =>
      fs.statSync(filename).isDirectory() || JS_EXT_REGEXP.test(filename),
  },
  () => {
    console.info('Copy done.');
  },
);
