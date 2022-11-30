import { cli, ToRunners } from '@modern-js/core';
import { logger, program } from '@modern-js/utils';
import { AppToolsHooks } from '../types/hooks';

export async function restart(hooksRunner: ToRunners<AppToolsHooks>) {
  logger.info('Restart...\n');

  let hasGetError = false;

  await hooksRunner.beforeRestart();

  try {
    await cli.init(cli.initOptions);
  } catch (err) {
    console.error(err);
    hasGetError = true;
  } finally {
    if (!hasGetError) {
      program.parse(process.argv);
    }
  }
}
