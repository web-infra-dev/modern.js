const path = require('path');
const fs = require('fs-extra');

const src = path.resolve(__dirname, '../src/client');
const dist = path.resolve(__dirname, '../dist/client');

fs.cp(src, dist, { recursive: true }, () => {
  console.info('Copy done.');
});
