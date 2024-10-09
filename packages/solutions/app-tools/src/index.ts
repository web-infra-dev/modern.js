import path from 'path';
import type { CliPlugin } from '@modern-js/core';
import { getLocaleLanguage } from '@modern-js/plugin-i18n/language-detector';
import { castArray } from '@modern-js/uni-builder';
import {
  cleanRequireCache,
  deprecatedCommands,
  emptyDir,
  getArgv,
  getCommand,
} from '@modern-js/utils';
import { hooks } from './hooks';
import { i18n } from './locale';
import analyzePlugin from './plugins/analyze';
import deployPlugin from './plugins/deploy';
import initializePlugin from './plugins/initialize';
import serverBuildPlugin from './plugins/serverBuild';
import type { AppTools } from './types';

import {
  buildCommand,
  deployCommand,
  devCommand,
  inspectCommand,
  newCommand,
  serverCommand,
  upgradeCommand,
} from './commands';
import { generateWatchFiles } from './utils/generateWatchFiles';
import { restart } from './utils/restart';

export { dev } from './commands/dev';
export type { DevOptions } from './utils/types';

export { mergeConfig } from '@modern-js/core';
export * from './defineConfig';
export * from './types';

export type { RuntimeUserConfig } from './types/config';

export type AppToolsOptions = {
  /**
   * Specify which bundler to use for the build.
   * @default `webpack`
   * */
  bundler?: 'rspack' | 'webpack' | 'experimental-rspack';
};
/**
 * The core package of the framework, providing CLI commands, build capabilities, configuration parsing and more.
 */
export const appTools = (
  options: AppToolsOptions = {
    // default webpack to be compatible with original projects
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
        options?.bundler &&
        ['rspack', 'experimental-rspack'].includes(options.bundler)
          ? 'rspack'
          : 'webpack',
    }),
    analyzePlugin({
      bundler:
        options?.bundler &&
        ['rspack', 'experimental-rspack'].includes(options.bundler)
          ? 'rspack'
          : 'webpack',
    }),
    serverBuildPlugin(),
    deployPlugin(),
  ],

  setup: api => {
    const appContext = api.useAppContext();
    api.setAppContext({
      ...appContext,
      toolsType: 'app-tools',
    });

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
        deprecatedCommands(program);
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
        const files = await generateWatchFiles(
          appContext,
          config.source.configDir,
        );

        const watchFiles = castArray(config.dev.watchFiles);
        watchFiles.forEach(({ type, paths }) => {
          if (type === 'reload-server') {
            files.push(...(Array.isArray(paths) ? paths : [paths]));
          }
        });

        return files;
      },

      // 这里会被 core/initWatcher 监听的文件变动触发，如果是 src 目录下的文件变动，则不做 restart
      async fileChange(e: {
        filename: string;
        eventType: string;
        isPrivate: boolean;
      }) {
        const { filename, eventType, isPrivate } = e;

        if (!isPrivate && (eventType === 'change' || eventType === 'unlink')) {
          const { closeServer } = await import('./utils/createServer.js');
          await closeServer();
          await restart(api.useHookRunners(), filename);
        }
      },

      async beforeRestart() {
        cleanRequireCache([require.resolve('./plugins/analyze')]);
      },
    };
  },
});

export default appTools;
