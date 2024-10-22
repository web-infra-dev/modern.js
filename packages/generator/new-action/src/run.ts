#!/usr/bin/env node

import { Command } from 'commander';

import { ModuleNewAction } from './module';
import { MWANewAction } from './mwa';

import { getSolutionByDependance } from './utils';

const main = async () => {
  const program = new Command();
  program
    .option('--solution <solution>', 'solution', '')
    .option('--config <config>', 'config', '{}')
    .option('--root-path <rootPath>', 'project root path', '')
    .option('--debug', 'using debug mode to log something', false)
    .option('--time', 'show run generator time log', false)
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
