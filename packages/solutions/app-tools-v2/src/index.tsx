import { CliPlugin } from '@modern-js/core';
import { getLocaleLanguage } from '@modern-js/plugin-i18n/language-detector';
import { AppTools } from './types';
import { hooks } from './hooks';
import { i18n } from './locale';
import {
  buildCommand,
  deployCommand,
  devCommand,
  inspectCommand,
  newCommand,
  serverCommand,
  upgradeCommand,
} from './commands';

export * from './defineConfig';

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
  console.log(options);
  return {
    name: '@modern-js/app-tools-v2',

    post: [],

    registerHook: hooks,

    usePlugins: [],

    setup: api => {
      const appContext = api.useAppContext();
      api.setAppContext({
        ...appContext,
        toolsType: 'app-tools',
      });

      const locale = getLocaleLanguage();
      i18n.changeLanguage({ locale });

      return {
        async commands({ program }) {
          await devCommand(program, api);
          await buildCommand(program, api);
          serverCommand(program, api);
          deployCommand(program, api);
          newCommand(program, locale);
          inspectCommand(program, api);
          upgradeCommand(program);
        },
      };
    },
  };
};

export default appTools;
