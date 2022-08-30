import { Command } from '@modern-js/utils';
import { upgradeAction } from './upgrade';

export default function () {
  const program = new Command();

  program
    .description('upgrade modern package to latest')
    .option('--cwd <cwd>', 'project path', '');

  program.action(upgradeAction);
  program.parse(process.argv);
}
