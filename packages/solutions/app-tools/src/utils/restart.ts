import type { ToRunners } from '@modern-js/core';
import { cli } from '@modern-js/plugin-v2/cli';
import { chalk, clearConsole, getFullArgv, logger } from '@modern-js/utils';
import { program } from '@modern-js/utils/commander';
import type { AppToolsHooks } from '../types/hooks';

export async function restart(
  hooksRunner: ToRunners<AppToolsHooks>,
  filename: string,
) {
  clearConsole();
  logger.info(`Restart because ${chalk.yellow(filename)} is changed...\n`);

  let hasGetError = false;

  await hooksRunner.beforeRestart();

  try {
    await cli.init(cli.getPrevInitOptions());
  } catch (err) {
    console.error(err);
    hasGetError = true;
  } finally {
    if (!hasGetError) {
      program.parse(getFullArgv());
    }
  }
}
