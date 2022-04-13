import type { PluginAPI } from '@modern-js/core';
import type { Command } from '@modern-js/utils';
import { buildWatch, IBuildWatchCommandOption } from '../commands';

export const buildWatchCli = (program: Command, api: PluginAPI) => {
  program
    .command('build-watch [project]')
    .usage('[options]')
    .option('--only-self', 'build target project with nothing')
    .option('-i, --init', 'init build beforebuild watch ')
    .description('watch target project and target project’s dependencies')
    .action(
      async (targetProjectName: string, option: IBuildWatchCommandOption) => {
        await buildWatch(targetProjectName, option, api);
      },
    );
};
