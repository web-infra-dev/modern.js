import { Command } from 'commander';
import { buildWatch, IBuildWatchCommandOption } from '../commands';

export const buildWatchCli = (program: Command) => {
  program
    .command('build-watch [project]')
    .usage('[options]')
    .option('--only-self', 'build target project with nothing')
    .option('-i, --init', 'init build beforebuild watch ')
    .description('watch target project and target project’s dependences')
    .action(
      async (targetProjectName: string, option: IBuildWatchCommandOption) => {
        await buildWatch(targetProjectName, option);
      },
    );
};
