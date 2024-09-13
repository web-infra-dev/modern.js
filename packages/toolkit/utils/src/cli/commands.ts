import type { Command } from '../../compiled/commander';
import { logger } from './logger';

export const getFullArgv = () => {
  return process.env.MODERN_ARGV?.split(' ') || process.argv;
};

export const getArgv = () => {
  return getFullArgv().slice(2);
};

export const getCommand = () => {
  const args = getArgv();
  const command = args[0];
  return command;
};

export const isDevCommand = () => {
  const command = getCommand();
  return command === 'dev' || command === 'start';
};

// @deprecated
// Can be removed in the next major version
export const deprecatedCommands = (
  program: Command & { commandsMap?: Map<string, Command> },
) => {
  const lintCommand = program.commandsMap?.get('lint');
  if (!lintCommand) {
    program
      .command('lint [...files]')
      .allowUnknownOption()
      .description('Deprecated')
      .action(() => {
        logger.warn(
          'The "modern lint" command is deprecated, please use "eslint" or "biome" instead.',
        );
      });
  }
  const preCommitCommand = program.commandsMap?.get('pre-commit');
  if (!preCommitCommand) {
    program
      .command('pre-commit')
      .description('Deprecated')
      .action(() => {
        logger.warn(
          'The "modern pre-commit" command is deprecated, please use "lint-staged" instead.',
        );
      });
  }
};
