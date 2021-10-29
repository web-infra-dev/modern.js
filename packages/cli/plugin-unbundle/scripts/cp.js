const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

const src = path.resolve(__dirname, '../src/client');
const dist = path.resolve(__dirname, '../dist/client');

const JS_EXT_REGEXP = /\.(mjs|cjs|js|jsx)$/;

fse.copy(
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
