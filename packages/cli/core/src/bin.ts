#!/usr/bin/env node
require('../compiled/v8-compile-cache');

// eslint-disable-next-line import/first
import { cli } from '.';

if (!process.env.NODE_ENV) {
  const command = process.argv[2];

  if (['build', 'start', 'deploy'].includes(command)) {
    process.env.NODE_ENV = 'production';
  } else if (command === 'test') {
    process.env.NODE_ENV = 'test';
  } else {
    process.env.NODE_ENV = 'development';
  }
}

const { version } = require('../package.json');

cli.run(process.argv.slice(2), { version });
