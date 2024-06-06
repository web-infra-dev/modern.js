#!/usr/bin/env node

import { Command } from '@modern-js/utils/commander';

import { MWANewAction } from './mwa';
import { ModuleNewAction } from './module';

import { getSolutionByDependance } from './utils';

const main = async () => {
  const program = new Command();
  program
    .option('--solution <solution>', 'solution', '')
    .option('--config <config>', 'config', '{}')
    .option('--root-path <rootPath>', 'project root path', '')
    .action(async params => {
      if (!params.solution) {
        params.solution = getSolutionByDependance();
      }

      const { solution, config: configStr, rootPath } = params;
      const config = JSON.parse(configStr);

      // for debug
      if (rootPath) {
        config.cwd = rootPath;
      }
      switch (solution) {
        case 'mwa':
          MWANewAction(config);
          break;
        case 'module':
          ModuleNewAction(config);
          break;
        default:
          break;
      }
    });

  program.parse(process.argv);
};

main();
