#!/usr/bin/env node
/* eslint-disable-next-line eslint-comments/disable-enable-pair */
/* eslint-disable import/first */

require('../compiled/v8-compile-cache');

import { minimist } from '@modern-js/utils';
import { cli, CoreOptions } from '.';

const command = process.argv[2];

if (!process.env.NODE_ENV) {
  if (['build', 'start', 'deploy', 'release'].includes(command)) {
    process.env.NODE_ENV = 'production';
  } else if (command === 'test') {
    process.env.NODE_ENV = 'test';
  } else {
    process.env.NODE_ENV = 'development';
  }
}

const { version } = require('../package.json');

const cliParams = minimist<{
  c?: string;
  config?: string;
}>(process.argv.slice(2));

const runOptions: CoreOptions = {
  version,
};

/**
 * Commands that support specify config files
 * Some commands can't support this feature, such as `new`
 */
const SUPPORT_CONFIG_PARAM_COMMANDS = [
  'dev',
  'build',
  'deploy',
  'start',
  'inspect',
];

const customConfigFile = cliParams.config || cliParams.c;

if (SUPPORT_CONFIG_PARAM_COMMANDS.includes(command) && customConfigFile) {
  runOptions.configFile = customConfigFile;
}

cli.run(process.argv.slice(2), runOptions);
