import { createPlugin } from '@modern-js/core';
import lint from './lint';
import preCommit from './pre-commit';

export default createPlugin(() => ({
  commands({ program }: any) {
    program
      .command('lint [...files]')
      .allowUnknownOption()
      .description('lint and fix source files')
      .option('--no-fix', 'disable auto fix source file')
      .action(() => {
        lint();
      });

    program
      .command('pre-commit')
      .description('auto run modern lint before commit')
      .action(() => {
        preCommit();
      });
  },
})) as any;
