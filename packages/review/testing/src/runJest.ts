/**
 * @file run jest by nodejs API
 * @description
 * Jest does not provide node API to run jest.
 * The followed code is inspired by
 * https://github.com/facebook/jest/blob/fdc74af37235354e077edeeee8aa2d1a4a863032/packages/jest-cli/src/cli/index.ts#L21
 */

import { Config } from '@jest/types';
import yargs from 'yargs/yargs';
import { runCLI } from 'jest';
import chalk from 'chalk';
import { getJestUtils, getFinalConfig } from './config';
import { TestConfig } from './types';
import { debug } from './utils';
import { createLifeCycle } from './plugin';

type Agrv = Omit<Config.Argv, '_' | '$0'>;

const buildArgv = async (
  rawArgv: string[],
  config: Agrv,
): Promise<Config.Argv> => {
  const argv = await yargs(rawArgv).argv;

  const result: Config.Argv = {
    $0: argv.$0,
    _: argv._.slice(1),
  };

  Object.keys(argv).forEach(key => {
    if (key.includes('-') || key === '_') {
      return;
    }

    result[key] = (argv as any)[key];
  });

  if (config) {
    result.config = JSON.stringify(config);
  }

  return result;
};

const readResultsAndExit = (
  result: { success: boolean },
  globalConfig: Config.GlobalConfig,
) => {
  const code = !result || result.success ? 0 : globalConfig.testFailureExitCode;

  // Only exit if needed
  process.on('exit', () => {
    if (typeof code === 'number' && code !== 0) {
      process.exitCode = code;
    }
  });

  if (globalConfig.forceExit) {
    if (!globalConfig.detectOpenHandles) {
      console.warn(
        `${chalk.bold(
          'Force exiting Jest: ',
        )}Have you considered using \`--detectOpenHandles\` to detect ` +
          `async operations that kept running after all tests finished?`,
      );
    }

    // eslint-disable-next-line no-process-exit
    process.exit(code);
  } else if (!globalConfig.detectOpenHandles) {
    setTimeout(() => {
      console.warn(
        chalk.yellow.bold(
          'Jest did not exit one second after the test run has completed.\n\n',
        ) +
          chalk.yellow(
            'This usually means that there are asynchronous operations that ' +
              "weren't stopped in your tests. Consider running Jest with " +
              '`--detectOpenHandles` to troubleshoot this issue.',
          ),
      );
    }, 1000).unref();
  }
};

/**
 * Node API: excute jest
 */
export async function runJest(
  config: Agrv,
  pwd: string = process.cwd(),
): Promise<void> {
  try {
    const argvConfig = await buildArgv(process.argv.slice(2), config);
    const { results, globalConfig } = await runCLI(argvConfig, [pwd]);

    readResultsAndExit(results, globalConfig);
  } catch (e: any) {
    console.error(chalk.red(e?.stack || e));

    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
}

/**
 * Node API: run test
 */
export async function runTest(config: TestConfig, pwd: string = process.cwd()) {
  process.env.NODE_ENV = 'test';

  const lifeCycle = createLifeCycle(config.plugins);

  const jestUtils = getJestUtils(config);

  await lifeCycle.jestConfig(jestUtils, {
    onLast: input => input as any,
  });

  const finalConfig = await getFinalConfig(jestUtils);

  debug('Jest config:', finalConfig);

  await runJest(finalConfig, pwd);
}
