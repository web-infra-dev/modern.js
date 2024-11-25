import { logger } from '@modern-js/utils';
import { cli } from '.';
import type { CLIOptions } from './types';

export const run = async (options: CLIOptions) => {
  const { initialLog, version, cwd, configFile, ...params } = options;

  if (initialLog) {
    logger.greet(`  ${initialLog}\n`);
  }

  const command = process.argv[2];

  if (!process.env.NODE_ENV) {
    if (['build', 'serve', 'deploy', 'analyze'].includes(command)) {
      process.env.NODE_ENV = 'production';
    } else if (command === 'test') {
      process.env.NODE_ENV = 'test';
    } else {
      process.env.NODE_ENV = 'development';
    }
  }

  await cli.run({
    version,
    cwd,
    command,
    configFile,
    ...params,
  });
};
