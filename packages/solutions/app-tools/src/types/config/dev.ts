import type { BuilderConfig } from '@modern-js/builder';
import type { SetupMiddlewares } from '@modern-js/server';

type BuilderDevConfig = Required<BuilderConfig>['dev'];

export type DevProxyOptions = string | Record<string, string>;

export interface DevUserConfig extends BuilderDevConfig {
  setupMiddlewares?: SetupMiddlewares;
}
