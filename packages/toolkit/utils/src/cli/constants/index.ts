import { InternalPlugins } from '@modern-js/types';

/**
 * route specification file
 */
export const ROUTE_SPEC_FILE = 'route.json';

/**
 * Front-end routing metadata
 */
export const NESTED_ROUTE_SPEC_FILE = 'nestedRoutes.json';

/**
 * main entry name
 */
export const MAIN_ENTRY_NAME = 'main';

/**
 * server side bundles directory, which relative to dist.
 */
export const SERVER_BUNDLE_DIRECTORY = 'bundles';

/**
 * server side bundles directory, which relative to dist.
 */
export const SERVER_WORKER_BUNDLE_DIRECTORY = 'worker';

/**
 * entry name pattern used for ajv pattern properties.
 */
export const ENTRY_NAME_PATTERN = '^[a-zA-Z0-9_-]+$';

/**
 * SSR server render function name
 */
export const SERVER_RENDER_FUNCTION_NAME = 'serverRender';

/**
 * loadbale manifest json file
 */
export const LOADABLE_STATS_FILE = 'loadable-stats.json';

/**
 * internal specified folder
 */
export const API_DIR = 'api';

export const SERVER_DIR = 'server';

export const SHARED_DIR = 'shared';

/**
 * Modern.config.ts cached dir
 */
export const CONFIG_CACHE_DIR = './node_modules/.cache/node-bundle-require';

export const CONFIG_FILE_EXTENSIONS = ['.js', '.ts', '.mjs'];

/**
 * Serialized config path
 */
export const OUTPUT_CONFIG_FILE = 'modern.config.json';

/**
 * Default server config basename
 */
export const DEFAULT_SERVER_CONFIG = 'modern.server-runtime.config';

/**
 * Routes manifest filename
 */
export const ROUTE_MANIFEST_FILE = 'routes-manifest.json';

/**
 * directory name for loader routes
 */
export const LOADER_ROUTES_DIR = `loader-routes`;
/**
 * default host for dev
 */
export const DEFAULT_DEV_HOST = '0.0.0.0';

/**
 * Internal app-tools plugins that work as soon as they are installed.
 */

export const INTERNAL_APP_TOOLS_PLUGINS: InternalPlugins = {
  '@modern-js/app-tools': '@modern-js/app-tools/cli',
  '@modern-js/plugin-proxy': '@modern-js/plugin-proxy/cli',
  '@modern-js/plugin-ssg': '@modern-js/plugin-ssg/cli',
  '@modern-js/plugin-bff': '@modern-js/plugin-bff/cli',
  '@modern-js/plugin-testing': '@modern-js/plugin-testing/cli',
  '@modern-js/plugin-storybook': '@modern-js/plugin-storybook/cli',
  '@modern-js/plugin-express': '@modern-js/plugin-express/cli',
  '@modern-js/plugin-koa': '@modern-js/plugin-koa/cli',
  '@modern-js/plugin-server': '@modern-js/plugin-server/cli',
  '@modern-js/plugin-garfish': '@modern-js/plugin-garfish/cli',
  '@modern-js/plugin-tailwindcss': '@modern-js/plugin-tailwindcss/cli',
  '@modern-js/plugin-polyfill': '@modern-js/plugin-polyfill/cli',
  // legacy router (inner react-router-dom v5)
  '@modern-js/plugin-router-v5': '@modern-js/plugin-router-v5/cli',
};

export const INTERNAL_APP_TOOLS_RUNTIME_PLUGINS: InternalPlugins = {
  '@modern-js/runtime': '@modern-js/runtime/cli',
};

/**
 * Internal module-tools plugins that work as soon as they are installed.
 */
export const INTERNAL_MODULE_TOOLS_PLUGINS: InternalPlugins = {
  '@modern-js/module-tools': '@modern-js/module-tools',
  '@modern-js/runtime': '@modern-js/runtime/cli',
  '@modern-js/plugin-testing': '@modern-js/plugin-testing/cli',
  '@modern-js/plugin-storybook': '@modern-js/plugin-storybook/cli',
  '@modern-js/plugin-tailwindcss': '@modern-js/plugin-tailwindcss/cli',
  // legacy router (inner react-router-dom v5)
  '@modern-js/plugin-router-legacy': '@modern-js/plugin-router-legacy/cli',
};

/**
 * Internal monorepo-tools plugins that work as soon as they are installed.
 */
export const INTERNAL_MONOREPO_TOOLS_PLUGINS: InternalPlugins = {
  '@modern-js/monorepo-tools': '@modern-js/monorepo-tools/cli',
  '@modern-js/plugin-testing': '@modern-js/plugin-testing/cli',
};

/**
 * Internal doc-tools plugins that work as soon as they are installed.
 */
export const INTERNAL_DOC_TOOLS_PLUGINS: InternalPlugins = {
  '@modern-js/doc-tools': '@modern-js/doc-tools',
  '@modern-js/runtime': '@modern-js/runtime/cli',
  '@modern-js/plugin-testing': '@modern-js/plugin-testing/cli',
};

/**
 * Internal plugins that work as soon as they are installed.
 */
export const INTERNAL_CLI_PLUGINS: InternalPlugins = {
  '@modern-js/app-tools': '@modern-js/app-tools/cli',
  '@modern-js/monorepo-tools': '@modern-js/monorepo-tools/cli',
  '@modern-js/module-tools': '@modern-js/module-tools',
  '@modern-js/doc-tools': '@modern-js/doc-tools',
  '@modern-js/runtime': '@modern-js/runtime/cli',
  '@modern-js/plugin-proxy': '@modern-js/plugin-proxy/cli',
  '@modern-js/plugin-ssg': '@modern-js/plugin-ssg/cli',
  '@modern-js/plugin-bff': '@modern-js/plugin-bff/cli',
  '@modern-js/plugin-testing': '@modern-js/plugin-testing/cli',
  '@modern-js/plugin-storybook': '@modern-js/plugin-storybook/cli',
  '@modern-js/plugin-express': '@modern-js/plugin-express/cli',
  '@modern-js/plugin-koa': '@modern-js/plugin-koa/cli',
  '@modern-js/plugin-server': '@modern-js/plugin-server/cli',
  '@modern-js/plugin-swc': '@modern-js/plugin-swc',
  '@modern-js/plugin-garfish': '@modern-js/plugin-garfish/cli',
  '@modern-js/plugin-tailwindcss': '@modern-js/plugin-tailwindcss/cli',
  '@modern-js/plugin-polyfill': '@modern-js/plugin-polyfill/cli',
  // legacy router (inner react-router-dom v5)
  '@modern-js/plugin-router-v5': '@modern-js/plugin-router-v5/cli',
};

export const SERVER_PLUGIN_BFF = '@modern-js/plugin-bff';
export const SERVER_PLUGIN_EXPRESS = '@modern-js/plugin-express';
export const SERVER_PLUGIN_KOA = '@modern-js/plugin-koa';
export const SERVER_PLUGIN_SERVER = '@modern-js/plugin-server';
export const SERVER_PLUGIN_POLYFILL = '@modern-js/plugin-polyfill';

export const INTERNAL_SERVER_PLUGINS: InternalPlugins = {
  [SERVER_PLUGIN_BFF]: '@modern-js/plugin-bff/server',
  [SERVER_PLUGIN_EXPRESS]: '@modern-js/plugin-express/server',
  [SERVER_PLUGIN_KOA]: '@modern-js/plugin-koa/server',
  [SERVER_PLUGIN_SERVER]: '@modern-js/plugin-server/server',
  [SERVER_PLUGIN_POLYFILL]: '@modern-js/plugin-polyfill/server',
};

/**
 * The `@babel/preset-typescript` default options.
 *
 * for:
 * - `@modern-js/builder-rspack-provider`
 * - `@modern-js/babel-preset-base`
 */
export const DEFAULT_BABEL_PRESET_TYPESCRIPT_OPTIONS = {
  allowNamespaces: true,
  allExtensions: true,
  allowDeclareFields: true,
  // aligns Babel's behavior with TypeScript's default behavior.
  // https://babeljs.io/docs/en/babel-preset-typescript#optimizeconstenums
  optimizeConstEnums: true,
  isTSX: true,
};

export * from './chainId';
