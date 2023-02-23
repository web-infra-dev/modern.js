import type { CliPlugin } from '@modern-js/core';
import lint from './lint';
import preCommit from './preCommit';

export default (): CliPlugin => ({
  name: '@modern-js/plugin-lint',
  setup: () => {
    return {
      commands({ program }) {
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
    };
  },
});
