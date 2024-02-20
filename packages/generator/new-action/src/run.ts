import { Command } from '@modern-js/utils/commander';

import { MWANewAction } from './mwa';
import { ModuleNewAction } from './module';
import { MonorepoNewAction } from './monorepo';

const main = async () => {
  const program = new Command();
  program
    .option('--solution <solution>', 'solution', 'mwa')
    .option('--config <config>', 'config', '')
    .option('--root-path <rootPath>', 'project root path', '')
    .action(async params => {
      console.log('params', params);
      const { solution, config: configStr, rootPath } = params;
      const config = JSON.parse(configStr);

      // for debug
      if (rootPath) {
        config.cwd = rootPath;
      }
      console.log('config', config);
      switch (solution) {
        case 'mwa':
          MWANewAction(config);
          break;
        case 'module':
          ModuleNewAction(config);
          break;
        case 'monorepo':
          MonorepoNewAction(config);
          break;
        default:
          break;
      }
    });

  program.parse(process.argv);
};

main();
