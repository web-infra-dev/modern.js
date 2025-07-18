import type { SetupMiddlewares } from '@modern-js/server';
import type { UniBuilderConfig } from '@modern-js/uni-builder';

type BuilderDevConfig = Required<UniBuilderConfig>['dev'];

export type DevProxyOptions = string | Record<string, string>;

export interface DevUserConfig extends BuilderDevConfig {
  setupMiddlewares?: SetupMiddlewares;
}
