import type { BuilderConfig } from '@modern-js/builder';
import type { SetupMiddlewares } from '@modern-js/server';
import type { CorsOptions } from '@modern-js/server';
import type { ServerConfig } from '@rsbuild/core';

type BuilderDevConfig = NonNullable<BuilderConfig['dev']>;

export type DevProxyOptions = string | Record<string, string>;

export interface DevServerUserConfig {
  /**
   * Configure CORS for the dev server.
   * - object: enable CORS with the specified options.
   * - true: enable CORS with default options (allow all origins, not recommended).
   * - false: disable CORS.
   * @default
   * ```js
   * { origin: defaultAllowedOrigins }
   * ```
   * where `defaultAllowedOrigins` includes:
   * - `localhost`
   * - `127.0.0.1`
   *
   * @link https://github.com/expressjs/cors
   */
  cors?: boolean | CorsOptions;
  /**
   * Whether to enable gzip compression for served static assets.
   */
  compress?: ServerConfig['compress'];
  /**
   * Adds headers to all responses.
   */
  headers?: ServerConfig['headers'];
  /**
   * The index.html page will likely have to be served in place of any 404 responses.
   */
  historyApiFallback?: ServerConfig['historyApiFallback'];
  /**
   * Proxying some URLs.
   */
  proxy?: ServerConfig['proxy'];
  /**
   * Whether to watch files change in directories such as `mock/`, `server/`, `api/`.
   */
  watch?: boolean;
}

/**
 * setupMiddlewares is a special field, it will not be passed to Rsbuild.
 * Although its name is the same as in Rsbuild, it is consumed by Modern.js.
 */
export type DevUserConfig = Omit<BuilderDevConfig, 'setupMiddlewares'> & {
  setupMiddlewares?: SetupMiddlewares;
  /**
   * Dev server specific options.
   */
  server?: DevServerUserConfig;
};
