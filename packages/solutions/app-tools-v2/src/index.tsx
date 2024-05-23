import path from 'path';
import { lintPlugin } from '@modern-js/plugin-lint';
import { CliPlugin } from '@modern-js/core';
import { getLocaleLanguage } from '@modern-js/plugin-i18n/language-detector';
import {
  cleanRequireCache,
  emptyDir,
  getArgv,
  getCommand,
} from '@modern-js/utils';
import initializePlugin from './plugins/initialize';
import { AppTools } from './types';
import { hooks } from './hooks';
import { i18n } from './locale';
import serverBuildPlugin from './plugins/serverBuild';
import {
  buildCommand,
  deployCommand,
  devCommand,
  inspectCommand,
  newCommand,
  serverCommand,
  upgradeCommand,
} from './commands';
import { restart } from './utils/restart';
import { generateWatchFiles } from './utils/watchFiles';
import analyzePlugin from './plugins/analyze';

export * from './defineConfig';
export * from './types';

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
): CliPlugin<AppTools<'shared'>> => {
  return {
    name: '@modern-js/app-tools-v2',

    post: ['@modern-js/plugin-initialize', '@modern-js/plugin-analyze'],

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

          if (
            !isPrivate &&
            (eventType === 'change' || eventType === 'unlink')
          ) {
            const { closeServer } = await import('./utils/server');
            await closeServer();
            await restart(api.useHookRunners(), filename);
          }
        },

        async beforeRestart() {
          cleanRequireCache([require.resolve('./analyze')]);
        },
      };
    },
  };
};

export default appTools;
