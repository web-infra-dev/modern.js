import type { Command } from '@modern-js/utils';
import { upgradeAction } from '@modern-js/utils';

export const upgradeCli = (program: Command) => {
  program
    .command('upgrade')
    .allowUnknownOption()
    .action(async () => {
      await upgradeAction();
    });
};
