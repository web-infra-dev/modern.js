/**
 * Property mounted on window that describes route manifest
 */
export const ROUTE_MANIFEST = `_MODERNJS_ROUTE_MANIFEST`;

/**
 * Property mounted on window that record all route modules
 */
export const ROUTE_MODULES = `_routeModules`;

/**
 * hmr socket connect path
 */
export const HMR_SOCK_PATH = '/webpack-hmr';

/**
 * html placeholder
 */
export const HTML_CHUNKSMAP_SEPARATOR = '<!--<?- chunksMap.js ?>-->';

/**
 * reporter name for server loader
 */
export const LOADER_REPORTER_NAME = `server-loader`;

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
 * SSR server render function name
 */
export const SERVER_RENDER_FUNCTION_NAME = 'serverRender';

export const SERVER_PLUGIN_BFF = '@modern-js/plugin-bff';
export const SERVER_PLUGIN_EXPRESS = '@modern-js/plugin-express';
export const SERVER_PLUGIN_KOA = '@modern-js/plugin-koa';
export const SERVER_PLUGIN_SERVER = '@modern-js/plugin-server';
export const SERVER_PLUGIN_POLYFILL = '@modern-js/plugin-polyfill';
