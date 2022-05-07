import type { PluginAPI } from '@modern-js/core';
import type { Command } from '@modern-js/utils';
import { build, IBuildCommandOption } from '../commands';

export const buildCli = (program: Command, api: PluginAPI) => {
  program
    .command('build [project]')
    .usage('[options]')
    .option('--no-self', 'build without target project')
    .option('-t, --dept', 'build target project with project’s dependent')
    .option('--no-deps', 'build target project without project’s dependencies')
    .option('--only-self', 'build target project with nothing')
    .option(
      '-a, --all',
      'build target project with project’s dependencies and dependent',
    )
    .option('--content-hash', 'build target project use content hash cache')
    .option('--git-hash', 'build target project use git hash cache')
    .description('build target project')
    .action(async (targetProjectName: string, option: IBuildCommandOption) => {
      await build(targetProjectName, option, api);
    });
};
