import type { Command } from '@modern-js/utils';

export const newCli = (program: Command) => {
  program.command('new').action(async () => {
    console.warn(
      'Monorepo tools not support new command. Please use npx @modern-js/create@latest to create project.',
    );
  });
};
