import path from 'path';
import { lintPlugin } from '@modern-js/plugin-lint';
import {
  cleanRequireCache,
  emptyDir,
  getCommand,
  getArgv,
  fs,
  NESTED_ROUTE_SPEC_FILE,
} from '@modern-js/utils';
import { CliPlugin } from '@modern-js/core';
import { getLocaleLanguage } from '@modern-js/plugin-i18n/language-detector';
import initializePlugin from './plugins/initialize';
import analyzePlugin from './plugins/analyze';
import serverBuildPlugin from './plugins/serverBuild';
import deployPlugin from './plugins/deploy';
import { AppTools } from './types';
import { hooks } from './hooks';
import { i18n } from './locale';

import { restart } from './utils/restart';
import { generateWatchFiles } from './utils/generateWatchFiles';
import {
  buildCommand,
  deployCommand,
  devCommand,
  inspectCommand,
  newCommand,
  serverCommand,
  upgradeCommand,
} from './commands';

export { dev } from './commands/dev';

export { mergeConfig } from '@modern-js/core';
export * from './defineConfig';
// eslint-disable-next-line import/export
export * from './types';

// eslint-disable-next-line import/export
export type { RuntimeUserConfig } from './types/config';

export type AppToolsOptions = {
  /**
   * Specify which bundler to use for the build.
   * @default `webpack`
   * */
  bundler?: 'experimental-rspack' | 'webpack';
};
/**
 * The core package of the framework, providing CLI commands, build capabilities, configuration parsing and more.
 */
export const appTools = (
  options: AppToolsOptions = {
    bundler: 'webpack',
  },
): CliPlugin<AppTools<'shared'>> => ({
  name: '@modern-js/app-tools',

  post: [
    '@modern-js/plugin-initialize',
    '@modern-js/plugin-analyze',
    '@modern-js/plugin-ssr',
    '@modern-js/plugin-document',
    '@modern-js/plugin-state',
    '@modern-js/plugin-router',
    '@modern-js/plugin-router-v5',
    '@modern-js/plugin-polyfill',
  ],

  registerHook: hooks,

  usePlugins: [
    initializePlugin({
      bundler:
        options?.bundler === 'experimental-rspack' ? 'rspack' : 'webpack',
    }),
    analyzePlugin({
      bundler:
        options?.bundler === 'experimental-rspack' ? 'rspack' : 'webpack',
    }),
    serverBuildPlugin(),
    lintPlugin(),
    deployPlugin(),
  ],

  setup: api => {
    const appContext = api.useAppContext();
    api.setAppContext({
      ...appContext,
      toolsType: 'app-tools',
    });
    const nestedRoutes: Record<string, unknown> = {};

    const locale = getLocaleLanguage();
    i18n.changeLanguage({ locale });

    return {
      async beforeConfig() {
        const userConfig = api.useConfigContext();
        const appContext = api.useAppContext();
        if (userConfig.output?.tempDir) {
          api.setAppContext({
            ...appContext,
            internalDirectory: path.resolve(
              appContext.appDirectory,
              userConfig.output.tempDir,
            ),
          });
        }
      },
      async commands({ program }) {
        await devCommand(program, api);
        await buildCommand(program, api);
        serverCommand(program, api);
        deployCommand(program, api);
        newCommand(program, locale);
        inspectCommand(program, api);
        upgradeCommand(program);
      },

      async prepare() {
        const command = getCommand();
        if (command === 'deploy') {
          const isSkipBuild = ['-s', '--skip-build'].some(tag => {
            return getArgv().includes(tag);
          });
          // if skip build, do not clean dist path
          if (isSkipBuild) {
            return;
          }
        }

        // clean dist path before building
        if (
          command === 'dev' ||
          command === 'start' ||
          command === 'build' ||
          command === 'deploy'
        ) {
          const resolvedConfig = api.useResolvedConfigContext();
          if (resolvedConfig.output.cleanDistPath) {
            const appContext = api.useAppContext();
            await emptyDir(appContext.distDirectory);
          }
        }
      },

      async watchFiles() {
        const appContext = api.useAppContext();
        const config = api.useResolvedConfigContext();
        return await generateWatchFiles(appContext, config.source.configDir);
      },

      // 这里会被 core/initWatcher 监听的文件变动触发，如果是 src 目录下的文件变动，则不做 restart
      async fileChange(e: {
        filename: string;
        eventType: string;
        isPrivate: boolean;
      }) {
        const { filename, eventType, isPrivate } = e;

        if (!isPrivate && (eventType === 'change' || eventType === 'unlink')) {
          const { closeServer } = await import('./utils/createServer');
          await closeServer();
          await restart(api.useHookRunners(), filename);
        }
      },

      async beforeRestart() {
        cleanRequireCache([require.resolve('./plugins/analyze')]);
      },

      async modifyFileSystemRoutes({ entrypoint, routes }) {
        nestedRoutes[entrypoint.entryName] = routes;

        return {
          entrypoint,
          routes,
        };
      },

      async beforeGenerateRoutes({ entrypoint, code }) {
        const { distDirectory } = api.useAppContext();

        await fs.outputJSON(
          path.resolve(distDirectory, NESTED_ROUTE_SPEC_FILE),
          nestedRoutes,
        );

        return {
          entrypoint,
          code,
        };
      },
    };
  },
});

export default appTools;
