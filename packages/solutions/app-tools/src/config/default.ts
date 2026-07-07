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

type ServerSSRConfig = NonNullable<AppUserConfig['server']>['ssr'];

const isStreamSSRConfig = (ssr: ServerSSRConfig) => {
  if (!ssr) {
    return false;
  }
  if (typeof ssr === 'boolean') {
    // `ssr: true` defaults to stream SSR in Modern.
    return ssr;
  }
  return ssr.mode !== 'string';
};

// `react-dom/client` (and `react-dom` on React 17) is dynamically imported by
// the runtime to render/hydrate on EVERY page load, so lazy-compiling it gains
// nothing and puts a compile round-trip on the first-paint/hydration critical
// path — under load (CI) that round-trip races page interactions and repeated
// page loads keep re-triggering rebuilds.
const EAGER_DYNAMIC_IMPORT_RE = /[\\/]react-dom[\\/]/;

/**
 * Default `lazyCompilation.test`: keep runtime-critical dynamic imports
 * (react-dom) eagerly compiled, lazy-compile everything else.
 */
export function defaultLazyCompilationTest(module: unknown): boolean {
  const resource = (module as { resource?: string } | null)?.resource || '';
  return !EAGER_DYNAMIC_IMPORT_RE.test(resource);
}

/**
 * Default-enable lazy compilation for pure CSR and stream SSR. Stream SSR keeps
 * first-screen route assets correct via the route-eager lazyCompilation.test
 * injected by the SSR builder plugin. String SSR, RSC and SSG stay disabled.
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
  if (server?.rsc) {
    return false;
  }
  if (server?.ssr && !isStreamSSRConfig(server.ssr)) {
    return false;
  }
  if (
    server?.ssrByEntries &&
    typeof server.ssrByEntries === 'object' &&
    Object.values(server.ssrByEntries).some(
      ssr => Boolean(ssr) && !isStreamSSRConfig(ssr),
    )
  ) {
    return false;
  }

  return true;
}
