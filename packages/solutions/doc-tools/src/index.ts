import type { CliPlugin } from '@modern-js/core';
import { dev } from '@modern-js/doc-core';

export type { CliPlugin };

export default (): CliPlugin => ({
  name: '@modern-js/doc-tools',

  setup: _api => {
    return {
      commands({ program }) {
        program
          .command('dev [root]')
          .description('start dev server')
          .action(async (root: string) => {
            await dev(root);
          });
      },
    };
  },
});
