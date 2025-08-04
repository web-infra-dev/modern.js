import type { BuilderConfig } from '@modern-js/builder';

type BuilderDevConfig = Required<BuilderConfig>['dev'];

export type DevProxyOptions = string | Record<string, string>;

export interface DevUserConfig extends BuilderDevConfig {
  setupMiddlewares?: any;
}
