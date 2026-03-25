import { logger } from '@modern-js/utils';
import { cli } from '.';
import type { CLIOptions } from './types';

const ENV_DIR_OPTION = '--env-dir';

function parseEnvDir(argv: string[]): string | undefined {
  const optionWithValue = `${ENV_DIR_OPTION}=`;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (!arg) {
      continue;
    }

    if (arg.startsWith(optionWithValue)) {
      const value = arg.slice(optionWithValue.length);
      return value || undefined;
    }

    if (arg === ENV_DIR_OPTION) {
      const value = argv[i + 1];
      if (!value || value.startsWith('-')) {
        return undefined;
      }
      return value;
    }
  }

  return undefined;
}

export const run = async (options: CLIOptions) => {
  const { initialLog, version, cwd, configFile, ...params } = options;

  if (initialLog) {
    logger.greet(`  ${initialLog}\n`);
  }

  const command = process.argv[2];
  const envDir = parseEnvDir(process.argv);

  if (envDir) {
    process.env.MODERN_ENV_DIR = envDir;
  }

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
