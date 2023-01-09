#!/usr/bin/env node
import { minimist, lodash } from '@modern-js/utils';
import { cli, CoreOptions } from '.';

export const run = async (
  otherCoreOptions: CoreOptions = {},
  options: {
    override?:
      | boolean
      | ((coreOptions: CoreOptions) => Promise<CoreOptions> | CoreOptions);
  } = {},
) => {
  const command = process.argv[2];

  if (!process.env.NODE_ENV) {
    if (['build', 'serve', 'deploy', 'release'].includes(command)) {
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
    'serve',
    'inspect',
  ];

  const customConfigFile = cliParams.config || cliParams.c;

  if (SUPPORT_CONFIG_PARAM_COMMANDS.includes(command) && customConfigFile) {
    runOptions.configFile = customConfigFile;
  }

  if (typeof options.override === 'boolean' && options.override) {
    await cli.run(otherCoreOptions);
  } else if (typeof options?.override === 'function') {
    await cli.run(await options.override(runOptions));
  } else {
    await cli.run(lodash.merge({}, runOptions, otherCoreOptions));
  }
};
