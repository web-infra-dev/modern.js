/**
 * alias to src directory
 */
export const INTERNAL_SRC_ALIAS = '@_modern_js_src';

/**
 * alias to node_modules/.modern-js
 */
export const INTERNAL_DIR_ALAIS = '@_modern_js_internal';

/**
 * hmr socket connect path
 */
export const HMR_SOCK_PATH = '/_modern_js_hmr_ws';

/**
 * route specification file
 */
export const ROUTE_SPEC_FILE = 'route.json';

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

export const HIDE_MODERN_JS_DIR = './node_modules/.modern-js';

/**
 * Internal plugins that work as soon as they are installed.
 */
export const INTERNAL_PLUGINS: {
  [name: string]: { cli?: string; server?: string };
} = {
  '@modern-js/app-tools': { cli: '@modern-js/app-tools/cli' },
  '@modern-js/monorepo-tools': { cli: '@modern-js/monorepo-tools/cli' },
  '@modern-js/module-tools': { cli: '@modern-js/module-tools/cli' },
  '@modern-js/runtime': { cli: '@modern-js/runtime/cli' },
  '@modern-js/plugin-less': { cli: '@modern-js/plugin-less/cli' },
  '@modern-js/plugin-sass': { cli: '@modern-js/plugin-sass/cli' },
  '@modern-js/plugin-esbuild': { cli: '@modern-js/plugin-esbuild/cli' },
  '@modern-js/plugin-proxy': { cli: '@modern-js/plugin-proxy/cli' },
  '@modern-js/plugin-ssg': { cli: '@modern-js/plugin-ssg/cli' },
  '@modern-js/plugin-bff': {
    cli: '@modern-js/plugin-bff/cli',
    server: '@modern-js/plugin-bff/server',
  },
  '@modern-js/plugin-electron': { cli: '@modern-js/plugin-electron/cli' },
  '@modern-js/plugin-testing': { cli: '@modern-js/plugin-testing/cli' },
  '@modern-js/plugin-storybook': { cli: '@modern-js/plugin-storybook/cli' },
  '@modern-js/plugin-docsite': { cli: '@modern-js/plugin-docsite/cli' },
  '@modern-js/plugin-express': {
    cli: '@modern-js/plugin-express/cli',
    server: '@modern-js/plugin-express',
  },
  '@modern-js/plugin-egg': {
    cli: '@modern-js/plugin-egg/cli',
    server: '@modern-js/plugin-egg',
  },
  '@modern-js/plugin-koa': {
    cli: '@modern-js/plugin-koa/cli',
    server: '@modern-js/plugin-koa',
  },
  '@modern-js/plugin-nest': {
    cli: '@modern-js/plugin-nest/cli',
    server: '@modern-js/plugin-nest/server',
  },
  '@modern-js/plugin-unbundle': { cli: '@modern-js/plugin-unbundle' },
  '@modern-js/plugin-server-build': { cli: '@modern-js/plugin-server-build' },
  '@modern-js/plugin-micro-frontend': {
    cli: '@modern-js/plugin-micro-frontend/cli',
  },
  '@modern-js/plugin-jarvis': { cli: '@modern-js/plugin-jarvis/cli' },
  '@modern-js/plugin-tailwindcss': { cli: '@modern-js/plugin-tailwindcss/cli' },
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
  '@modern-js/plugin-bff': [
    {
      target: 'bff',
      schema: {
        type: 'object',
        properties: {
          prefix: { type: 'string' },
          fetcher: { type: 'string' },
          proxy: { type: 'object' },
          requestCreater: { type: 'string' },
        },
      },
    },
  ],
  '@modern-js/plugin-esbuild': [
    {
      target: 'tools.esbuild',
      schema: { typeof: ['object'] },
    },
  ],
  '@modern-js/plugin-less': [
    {
      target: 'tools.less',
      schema: { typeof: ['object', 'function'] },
    },
  ],
  '@modern-js/plugin-sass': [
    {
      target: 'tools.sass',
      schema: { typeof: ['object', 'function'] },
    },
  ],
  '@modern-js/plugin-tailwindcss': [
    {
      target: 'tools.tailwindcss',
      schema: { typeof: ['object', 'function'] },
    },
    {
      target: 'source.designSystem',
      schema: { typeof: ['object'] },
    },
  ],
  '@modern-js/plugin-proxy': [
    {
      target: 'dev.proxy',
      schema: { typeof: ['string', 'object'] },
    },
  ],
  '@modern-js/plugin-unbundle': [
    {
      target: 'source.disableAutoImportStyle',
      schema: { type: 'boolean' },
    },
    {
      target: 'server.https',
      schema: { type: 'boolean' },
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
  '@modern-js/plugin-ssr': [
    {
      target: 'runtime.ssr',
      schema: { type: ['boolean', 'object'] },
    },
  ],
  '@modern-js/plugin-state': [
    {
      target: 'runtime.state',
      schema: { type: ['boolean', 'object'] },
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
      schema: { typeof: ['object'] },
    },
  ],
  '@modern-js/plugin-micro-frontend': [
    {
      target: 'runtime.masterApp',
      schema: { type: ['object'] },
    },
    {
      target: 'dev.withMasterApp',
      schema: { type: ['object'] },
    },
  ],
};
