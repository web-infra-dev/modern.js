import type { CliPlugin } from '@modern-js/core';
import type { UserConfig, Sidebar, NavItem } from '@modern-js/doc-core';
import { logger } from '@modern-js/utils/logger';
import chalk from '@modern-js/utils/chalk';
import { schema } from './config/schema';

export type { CliPlugin, Sidebar, NavItem, UserConfig };

const MODERN_CONFIG_FILES = ['modern.config.ts', 'modern.config.js'];

interface ServerInstance {
  close: () => Promise<void>;
}

export default (): CliPlugin => ({
  name: '@modern-js/doc-tools',
  setup: async api => {
    const { dev, build } = await import('@modern-js/doc-core');
    let server: ServerInstance | undefined;
    let restartServer: (() => Promise<void>) | undefined;
    return {
      validateSchema: () => {
        return schema;
      },
      watchFiles() {
        const config = api.useAppContext();
        return [config.configFile];
      },
      async fileChange({ filename, eventType }) {
        const isConfigFile = MODERN_CONFIG_FILES.some(configFileName =>
          filename.endsWith(configFileName),
        );
        if (isConfigFile && eventType === 'change' && server) {
          logger.info(
            `${chalk.green(
              filename,
            )} has changed, dev server will restart...\n`,
          );
          // Config file HMR in devepment mode
          await server.close();
          await restartServer!();
        }
      },
      commands({ program }) {
        program
          .command('dev [root]')
          .description('start dev server')
          .action(async (root?: string) => {
            restartServer = async () => {
              const config = api.useConfigContext() as UserConfig;
              server = await dev(root || '', config);
            };
            await restartServer();
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
