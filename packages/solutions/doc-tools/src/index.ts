import type { CliPlugin } from '@modern-js/core';
import type { UserConfig } from '@modern-js/doc-core';
import { schema } from './config/schema';

export type { CliPlugin };

export default (): CliPlugin => ({
  name: '@modern-js/doc-tools',
  setup: async api => {
    const { dev, build } = await import('@modern-js/doc-core');
    return {
      validateSchema: () => {
        return schema;
      },
      commands({ program }) {
        program
          .command('dev [root]')
          .description('start dev server')
          .action(async (root?: string) => {
            const config = api.useConfigContext() as UserConfig;
            await dev(root || '', config);
          });

        program
          .command('build [root]')
          .description('build in production')
          .action(async (root?: string) => {
            const config = api.useConfigContext() as UserConfig;
            await build(root || '', config);
          });
      },
    };
  },
});

export { defineConfig } from './config/defineConfig';
