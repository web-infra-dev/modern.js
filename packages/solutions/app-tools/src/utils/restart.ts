import { cli } from '@modern-js/plugin-v2/cli';
import { chalk, clearConsole, getFullArgv, logger } from '@modern-js/utils';
import { program } from '@modern-js/utils/commander';
import type { AppToolsHooks } from '../types/plugin';

export async function restart(hooks: AppToolsHooks, filename: string) {
  clearConsole();
  logger.info(`Restart because ${chalk.yellow(filename)} is changed...\n`);

  let hasGetError = false;

  await hooks.onBeforeRestart.call();

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
