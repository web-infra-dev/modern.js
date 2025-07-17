import type { InternalPlugins } from '@modern-js/types';

export {
  NESTED_ROUTE_SPEC_FILE,
  MAIN_ENTRY_NAME,
  ROUTE_SPEC_FILE,
  SERVER_BUNDLE_DIRECTORY,
  SERVER_RENDER_FUNCTION_NAME,
  SERVER_PLUGIN_BFF,
  SERVER_PLUGIN_SERVER,
  SERVER_PLUGIN_POLYFILL,
} from '../universal/constants';

export const JS_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx'];

/**
 * server side bundles directory, which relative to dist.
 */
export const SERVER_WORKER_BUNDLE_DIRECTORY = 'worker';

/**
 * entry name pattern used for ajv pattern properties.
 */
export const ENTRY_NAME_PATTERN = '^[a-zA-Z0-9_-]+$';

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
export const CONFIG_CACHE_DIR = './node_modules/.cache/bundle-require';

export const CONFIG_FILE_EXTENSIONS = ['.js', '.ts', '.mjs'];

/**
 * Serialized config path
 */
export const OUTPUT_CONFIG_FILE = 'modern.config.json';

/**
 * Default runtime config filename
 */
export const DEFAULT_RUNTIME_CONFIG = 'modern.runtime';

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

export const INTERNAL_APP_TOOLS_RUNTIME_PLUGINS: InternalPlugins = {
  '@modern-js/runtime': '@modern-js/runtime/cli',
};
