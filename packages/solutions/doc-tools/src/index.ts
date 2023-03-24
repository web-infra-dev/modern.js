import type { CliPlugin } from '@modern-js/core';
import type {
  UserConfig,
  Sidebar,
  NavItem,
  DocPlugin,
} from '@modern-js/doc-core';
import { logger } from '@modern-js/utils/logger';
import chalk from '@modern-js/utils/chalk';
import { cli } from '@modern-js/core';
import { schema } from './config/schema';

export type { CliPlugin, Sidebar, NavItem, UserConfig, DocPlugin };

const MODERN_CONFIG_FILES = ['modern.config.ts', 'modern.config.js'];

interface ServerInstance {
  close: () => Promise<void>;
}

interface DocToolsOptions {
  configFiles?: string[];
  extraDocConfig?: UserConfig['doc'];
}

const WATCH_FILE_TYPES = ['.md', '.mdx', '.tsx', '.jsx', '.ts', '.js'];

export default ({
  configFiles = MODERN_CONFIG_FILES,
  extraDocConfig = {},
}: DocToolsOptions): CliPlugin => ({
  name: '@modern-js/doc-tools',
  setup: async api => {
    const { dev, build, serve } = await import('@modern-js/doc-core');
    let server: ServerInstance | undefined;
    let startServer: ((isFirst?: boolean) => Promise<void>) | undefined;
    return {
      validateSchema: () => {
        return schema;
      },
      config() {
        return {
          doc: extraDocConfig,
        };
      },
      watchFiles() {
        const { configFile } = api.useAppContext();
        const config = api.useConfigContext() as UserConfig & {
          configFile: string;
        };
        // Concern: if the doc root is set by cli, we cannot get the root parms in `watchFiles` hook, so we can only get the root from config file.
        return [configFile, config.doc?.root].filter(Boolean);
      },
      async fileChange({ filename, eventType }) {
        const isConfigFile = configFiles.some(configFileName =>
          filename.endsWith(configFileName),
        );
        const isWatchFileType = WATCH_FILE_TYPES.some(type =>
          filename.endsWith(type),
        );
        if (
          ((isConfigFile && eventType === 'change') ||
            eventType === 'add' ||
            eventType === 'unlink') &&
          server &&
          isWatchFileType
        ) {
          logger.info(
            `${chalk.green(
              filename,
            )} has changed, dev server will restart...\n`,
          );
          // Config file HMR in devepment mode
          await server.close();
          await startServer!();
        }
      },
      commands({ program }) {
        program
          .command('dev [root]')
          .description('start dev server')
          .option('-c --config <config>', 'specify config file')
          .action(async (root?: string) => {
            startServer = async (isFristStart = false) => {
              if (!isFristStart) {
                try {
                  await cli.init(cli.getPrevInitOptions());
                } catch (err) {
                  console.error(err);
                }
              }
              const config = api.useConfigContext() as UserConfig;

              server = await dev(root || '', config);
            };
            await startServer(true);
          });

        program
          .command('build [root]')
          .description('build in production')
          .option('-c --config <config>', 'specify config file')
          .action(async (root?: string) => {
            const config = api.useConfigContext() as UserConfig;
            await build(root || '', config);
          });

        program
          .command('preview [root]')
          .description('preview in production')
          .option('-c --config <config>', 'specify config file')
          .option('--port [port]', 'port number')
          .option('--host [host]', 'hostname')
          .action(async (root?: string) => {
            const config = api.useConfigContext() as UserConfig;
            await serve(root || '', config);
          });
      },
    };
  },
});

export { defineConfig } from './config/defineConfig';
