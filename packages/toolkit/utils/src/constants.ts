import { InternalPlugins } from '@modern-js/types';

/**
 * hmr socket connect path
 */
export const HMR_SOCK_PATH = '/webpack-hmr';

/**
 * route specification file
 */
export const ROUTE_SPEC_FILE = 'route.json';

/**
 * main entry name
 */
export const MAIN_ENTRY_NAME = 'main';

/**
 * open editor request path
 */
export const LAUNCH_EDITOR_ENDPOINT = '/__open-stack-frame-in-editor';

/**
 * server side bundles directory, which relative to dist.
 */
export const SERVER_BUNDLE_DIRECTORY = 'bundles';

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

export const CONFIG_FILE_EXTENSIONS = ['.js', '.ts', '.ejs', '.mjs'];

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
export const ROUTE_MINIFEST_FILE = 'routes-manifest.json';

/**
 * Property mounted on window that describes route manifest
 */
export const ROUTE_MANIFEST = `_MODERNJS_ROUTE_MANIFEST`;

/**
 * directory name for loader routes
 */
export const LOADER_ROUTES_DIR = `loader-routes`;

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
  '@modern-js/plugin-egg': '@modern-js/plugin-egg/cli',
  '@modern-js/plugin-koa': '@modern-js/plugin-koa/cli',
  '@modern-js/plugin-nest': '@modern-js/plugin-nest/cli',
  '@modern-js/plugin-server': '@modern-js/plugin-server/cli',
  '@modern-js/plugin-garfish': '@modern-js/plugin-garfish/cli',
  '@modern-js/plugin-tailwindcss': '@modern-js/plugin-tailwindcss/cli',
  '@modern-js/plugin-polyfill': '@modern-js/plugin-polyfill/cli',
  // legacy router (inner react-router-dom v5)
  '@modern-js/plugin-router-legacy': '@modern-js/plugin-router-legacy/cli',
};

export const INTERNAL_APP_TOOLS_RUNTIME_PLUGINS: InternalPlugins = {
  '@modern-js/runtime': '@modern-js/runtime/cli',
};

/**
 * Internal module-tools plugins that work as soon as they are installed.
 */
export const INTERNAL_MODULE_TOOLS_PLUGINS: InternalPlugins = {
  '@modern-js/module-tools': '@modern-js/module-tools',
  '@modern-js/doc-tools': '@modern-js/doc-tools',
  '@modern-js/runtime': '@modern-js/runtime/cli',
  '@modern-js/plugin-testing': '@modern-js/plugin-testing/cli',
  '@modern-js/plugin-storybook': '@modern-js/plugin-storybook/cli',
  '@modern-js/plugin-tailwindcss': '@modern-js/plugin-tailwindcss/cli',
  // TODO: Maybe can remove it
  '@modern-js/plugin-nocode': '@modern-js/plugin-nocode/cli',
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
  '@modern-js/plugin-egg': '@modern-js/plugin-egg/cli',
  '@modern-js/plugin-koa': '@modern-js/plugin-koa/cli',
  '@modern-js/plugin-nest': '@modern-js/plugin-nest/cli',
  '@modern-js/plugin-server': '@modern-js/plugin-server/cli',
  '@modern-js/plugin-swc': '@modern-js/plugin-swc',
  '@modern-js/plugin-garfish': '@modern-js/plugin-garfish/cli',
  '@modern-js/plugin-tailwindcss': '@modern-js/plugin-tailwindcss/cli',
  '@modern-js/plugin-polyfill': '@modern-js/plugin-polyfill/cli',
  // TODO: Maybe can remove it
  '@modern-js/plugin-nocode': '@modern-js/plugin-nocode/cli',
  // legacy router (inner react-router-dom v5)
  '@modern-js/plugin-router-legacy': '@modern-js/plugin-router-legacy/cli',
};

export const SERVER_PLUGIN_BFF = '@modern-js/plugin-bff';
export const SERVER_PLUGIN_EXPRESS = '@modern-js/plugin-express';
export const SERVER_PLUGIN_EGG = '@modern-js/plugin-egg';
export const SERVER_PLUGIN_KOA = '@modern-js/plugin-koa';
export const SERVER_PLUGIN_NEST = '@modern-js/plugin-nest';
export const SERVER_PLUGIN_SERVER = '@modern-js/plugin-server';
export const SERVER_PLUGIN_POLYFILL = '@modern-js/plugin-polyfill';

export const INTERNAL_SERVER_PLUGINS: InternalPlugins = {
  [SERVER_PLUGIN_BFF]: '@modern-js/plugin-bff/server',
  [SERVER_PLUGIN_EXPRESS]: '@modern-js/plugin-express/server',
  [SERVER_PLUGIN_EGG]: '@modern-js/plugin-egg/server',
  [SERVER_PLUGIN_KOA]: '@modern-js/plugin-koa/server',
  [SERVER_PLUGIN_NEST]: '@modern-js/plugin-nest/server',
  [SERVER_PLUGIN_SERVER]: '@modern-js/plugin-server/server',
  [SERVER_PLUGIN_POLYFILL]: '@modern-js/plugin-polyfill/server',
};

/**
 * The schema registered in the plugin.
 */
export const PLUGIN_SCHEMAS = {
  '@modern-js/runtime': [
    {
      target: 'runtime',
      schema: {
        type: 'object',
        additionalProperties: false,
      },
    },
    {
      target: 'runtimeByEntries',
      schema: {
        type: 'object',
        patternProperties: { [ENTRY_NAME_PATTERN]: { type: 'object' } },
        additionalProperties: false,
      },
    },
  ],
  '@modern-js/plugin-swc': [
    {
      target: 'tools.swc',
      schema: { typeof: ['object'] },
    },
  ],
  '@modern-js/plugin-bff': [
    {
      target: 'bff',
      schema: {
        type: 'object',
        properties: {
          prefix: {
            type: ['string', 'array'],
            items: { type: 'string' },
          },
          fetcher: { type: 'string' },
          proxy: { type: 'object' },
          requestCreator: { type: 'string' },
        },
      },
    },
  ],
  '@modern-js/plugin-tailwindcss': [
    {
      target: 'tools.tailwindcss',
      schema: { typeof: ['object', 'function'] },
    },
  ],
  '@modern-js/plugin-proxy': [
    {
      target: 'dev.proxy',
      schema: { typeof: ['string', 'object'] },
    },
  ],
  '@modern-js/plugin-ssg': [
    {
      target: 'output.ssg',
      schema: {
        oneOf: [
          { type: 'boolean' },
          { type: 'object' },
          { instanceof: 'Function' },
        ],
      },
    },
  ],
  '@modern-js/plugin-state': [
    {
      target: 'runtime.state',
      schema: { type: ['boolean', 'object'] },
    },
  ],
  '@modern-js/plugin-design-token': [
    // Legacy Features
    {
      target: 'source.designSystem',
      schema: { typeof: ['object'] },
    },
    {
      target: 'source.designSystem.supportStyledComponents',
      schema: { type: ['boolean'] },
    },
    {
      target: 'designSystem',
      schema: { typeof: ['object'] },
    },
  ],
  '@modern-js/plugin-router': [
    {
      target: 'runtime.router',
      schema: { type: ['boolean', 'object'] },
    },
  ],
  '@modern-js/plugin-testing': [
    {
      target: 'testing',
      schema: { typeof: ['object'] },
    },
    {
      target: 'tools.jest',
      schema: { typeof: ['object', 'function'] },
    },
  ],
  '@modern-js/plugin-garfish': [
    {
      target: 'runtime.masterApp',
      schema: { type: ['boolean', 'object'] },
    },
    {
      target: 'dev.withMasterApp',
      schema: { type: ['object'] },
    },
    {
      target: 'deploy.microFrontend',
      schema: { type: ['boolean', 'object'] },
    },
  ],
  '@modern-js/plugin-nocode': [],
};
