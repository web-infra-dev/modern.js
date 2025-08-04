import type { BuilderConfig } from '@modern-js/builder';
import type { SetupMiddlewares } from '@modern-js/server';

type BuilderDevConfig = Omit<
  Required<BuilderConfig>['dev'],
  'setupMiddlewares'
>;

export type DevProxyOptions = string | Record<string, string>;

/**
 * setupMiddlewares is a special field, it will not be passed to Rsbuild.
 * Although its name is the same as in Rsbuild, it is consumed by Modern.js.
 */
export interface DevUserConfig extends BuilderDevConfig {
  setupMiddlewares?: SetupMiddlewares;
}
