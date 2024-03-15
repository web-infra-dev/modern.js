import type { Command } from '@modern-js/utils';
import { upgradeAction } from '@modern-js/utils';

export const upgradeCli = (program: Command) => {
  program
    .command('upgrade')
    .allowUnknownOption()
    .option('-h --help', 'Show help') // In order to upgrade help work.
    .action(async () => {
      await upgradeAction();
    });
};
