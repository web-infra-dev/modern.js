import type { CliPlugin } from '@modern-js/core';
import type {
  UserConfig,
  Sidebar,
  NavItem,
  DocPlugin,
  AdditionalPage,
} from '@modern-js/doc-core';
import { logger } from '@modern-js/utils/logger';
import chalk from '@modern-js/utils/chalk';
import { cli } from '@modern-js/core';

export type {
  CliPlugin,
  Sidebar,
  NavItem,
  UserConfig,
  DocPlugin,
  AdditionalPage,
};

const MODERN_CONFIG_FILES = [
  'modern.config.ts',
  'modern.config.js',
  '_meta.json',
];

interface ServerInstance {
  close: () => Promise<void>;
}

interface DocToolsOptions {
  configFiles?: string[];
  extraDocConfig?: UserConfig['doc'];
}

const WATCH_FILE_TYPES = ['.md', '.mdx', '.tsx', '.jsx', '.ts', '.js', '.json'];

export const docTools = (options: DocToolsOptions = {}): CliPlugin => ({
  name: '@modern-js/doc-tools',
  setup: async api => {
    const appContext = api.useAppContext();
    api.setAppContext({
      ...appContext,
      toolsType: 'doc-tools',
    });

    const { configFiles = MODERN_CONFIG_FILES, extraDocConfig = {} } = options;
    const { dev, build, serve, mergeDocConfig } = await import(
      '@modern-js/doc-core'
    );
    let server: ServerInstance | undefined;
    let startServer: ((isFirst?: boolean) => Promise<void>) | undefined;
    return {
      watchFiles() {
        const { configFile } = api.useAppContext();
        const config = api.useConfigContext() as UserConfig & {
          configFile: string;
        };
        // Concern: if the doc root is set by cli, we cannot get the root parms in `watchFiles` hook, so we can only get the root from config file.
        return [configFile, config.doc?.root, '**/_meta.json'].filter(
          Boolean,
        ) as string[];
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
          .description('start the dev server')
          .option('-c --config <config>', 'specify config file')
          .action(async (docRoot?: string) => {
            startServer = async (isFristStart = false) => {
              if (!isFristStart) {
                try {
                  await cli.init(cli.getPrevInitOptions());
                } catch (err) {
                  console.error(err);
                }
              }
              const config = api.useConfigContext() as UserConfig;
              const app = api.useAppContext();
              const { appDirectory } = app;
              const docConfig = mergeDocConfig(config, {
                doc: extraDocConfig,
              });
              server = await dev({
                appDirectory,
                docDirectory: docRoot || '',
                config: docConfig,
              });
            };
            await startServer(true);
          });

        program
          .command('build [root]')
          .description('build the document site for production')
          .option('-c --config <config>', 'specify config file')
          .action(async (docRoot?: string) => {
            const config = api.useConfigContext() as UserConfig;
            const docConfig = mergeDocConfig(config, {
              doc: extraDocConfig,
            });
            const app = api.useAppContext();
            const { appDirectory } = app;
            await build({
              appDirectory,
              docDirectory: docRoot || '',
              config: docConfig,
            });
          });

        program
          .command('preview [root]')
          .alias('serve')
          .description('preview the production build locally')
          .option('-c --config <config>', 'specify config file')
          .option('--port [port]', 'port number')
          .option('--host [host]', 'hostname')
          .action(
            async (
              root?: string,
              options?: { port?: number; host?: string },
            ) => {
              const { port, host } = options || {};
              const config = api.useConfigContext() as UserConfig;
              const docConfig = mergeDocConfig(config, {
                doc: extraDocConfig,
              });
              await serve({
                config: docConfig,
                host,
                port,
              });
            },
          );
      },
    };
  },
});

export default docTools;

export { defineConfig } from './config/defineConfig';
