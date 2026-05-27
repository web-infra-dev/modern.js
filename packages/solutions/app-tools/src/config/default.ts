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
      // temporarily disable the `o` shortcut key, as it opens the wrong URL (/html/main => 404).
      custom: (shortcuts = []) =>
        shortcuts.filter(
          ({ key }) => key !== 'r' && key !== 'u' && key !== 'o',
        ),
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
    enableAsyncPreEntry: false,
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
  };
}

/**
 * Default-enable lazy compilation only for pure CSR. SSR (any mode), RSC and SSG
 * inject first-screen chunks/CSS at render time, which lazy compilation defers.
 */
export function isLazyCompilationSafeByDefault(
  userConfig: Pick<AppUserConfig, 'server' | 'output'>,
): boolean {
  const { server, output } = userConfig;

  if (
    output?.ssg ||
    (output?.ssgByEntries && Object.keys(output.ssgByEntries).length > 0)
  ) {
    return false;
  }
  if (server?.rsc || server?.ssr) {
    return false;
  }
  if (
    server?.ssrByEntries &&
    typeof server.ssrByEntries === 'object' &&
    Object.values(server.ssrByEntries).some(Boolean)
  ) {
    return false;
  }

  return true;
}
