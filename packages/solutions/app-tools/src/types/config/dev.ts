import type { BuilderConfig } from '@modern-js/builder';
import type { SetupMiddlewares } from '@modern-js/server';
import type { CorsOptions } from '@modern-js/server';

type BuilderDevConfig = Omit<
  Required<BuilderConfig>['dev'],
  'setupMiddlewares'
>;

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
}

/**
 * setupMiddlewares is a special field, it will not be passed to Rsbuild.
 * Although its name is the same as in Rsbuild, it is consumed by Modern.js.
 */
export interface DevUserConfig extends BuilderDevConfig {
  setupMiddlewares?: SetupMiddlewares;
  /**
   * Dev server specific options.
   */
  server?: DevServerUserConfig;
}
