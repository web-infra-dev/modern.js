import { cli } from '@modern-js/plugin-v2/cli';
import {
  chalk,
  clearConsole,
  getFullArgv,
  logger,
  program,
} from '@modern-js/utils';
import type { AppTools } from '../new/types';

export async function restart(api: AppTools<'shared'>, filename: string) {
  clearConsole();
  logger.info(`Restart because ${chalk.yellow(filename)} is changed...\n`);

  let hasGetError = false;

  const hooks = api.getHooks();
  await hooks.onBeforeRestart.call();

  try {
    await cli.init(cli.getPrevInitOptions()!);
  } catch (err) {
    console.error(err);
    hasGetError = true;
  } finally {
    if (!hasGetError) {
      program.parse(getFullArgv());
    }
  }
}
