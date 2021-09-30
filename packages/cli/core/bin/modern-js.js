#!/usr/bin/env node

require('v8-compile-cache');
const { cli } = require('../');
const { version } = require('../package.json');

process.env.MODERN_JS_VERSION = version;
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV =
    // eslint-disable-next-line no-nested-ternary
    ['build', 'start', 'deploy'].indexOf(process.argv[2]) !== -1
      ? 'production'
      : process.argv[2] === 'test'
      ? 'test'
      : 'development';
}

cli.run(process.argv.slice(2));
