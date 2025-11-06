import { DEFAULT_ENTRY_NAME, MAIN_ENTRY_NAME } from '@modern-js/utils';
import type { AppUserConfig } from '../types';
import type { AppToolsContext } from '../types/plugin';
import { getAutoInjectEnv } from '../utils/env';

// Define some default values that are different from rsbuild default config or used in useResolvedConfigContext
export function createDefaultConfig(
  appContext: AppToolsContext,
): AppUserConfig {
  const dev: AppUserConfig['dev'] = {
    cliShortcuts: {
      help: false,
      // does not support restart server and print urls yet
      custom: (shortcuts = []) =>
        shortcuts.filter(({ key }) => key !== 'r' && key !== 'u'),
    },
  };

  const output: AppUserConfig['output'] = {
    distPath: {
      root: 'dist',
      html: 'html',
      js: 'static/js',
      css: 'static/css',
      server: 'bundles',
      worker: 'worker',
    },
    cleanDistPath: true,
    enableInlineRouteManifests: true,
    disableInlineRouteManifests: false,
  };

  const source: AppUserConfig['source'] & {
    alias: Record<string, string>;
  } = {
    entries: undefined,
    mainEntryName: DEFAULT_ENTRY_NAME,
    enableAsyncEntry: false,
    disableDefaultEntries: false,
    entriesDir: './src',
    configDir: './config',
    globalVars: getAutoInjectEnv(appContext),
    alias: {},
  };

  const resolve: AppUserConfig['resolve'] = {
    alias: {
      [appContext.internalDirAlias]: appContext.internalDirectory,
      [appContext.internalSrcAlias]: appContext.srcDirectory!,
      '@': appContext.srcDirectory!,
      '@shared': appContext.sharedDirectory,
    },
  };

  const html: AppUserConfig['html'] = {
    title: '',
    mountId: 'root',
    meta: {
      charset: { charset: 'utf-8' },
      viewport:
        'width=device-width, initial-scale=1.0, shrink-to-fit=no, viewport-fit=cover, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no',
      'http-equiv': { 'http-equiv': 'x-ua-compatible', content: 'ie=edge' },
      renderer: 'webkit',
      layoutmode: 'standard',
      imagemode: 'force',
      'wap-font-scale': 'no',
      'format-detection': 'telephone=no',
    },
  };

  const server: AppUserConfig['server'] = {
    routes: undefined,
    publicRoutes: undefined,
    ssr: undefined,
    ssrByEntries: undefined,
    baseUrl: '/',
    port: 8080,
  };

  return {
    source,
    resolve,
    output,
    server,
    dev,
    html,
    tools: {
      tsChecker: {
        issue: {
          exclude: [{ file: '**/api/lambda/**/*' }],
        },
      },
    },
    plugins: [],
    builderPlugins: [],
    runtime: {},
    runtimeByEntries: {},
  };
}
