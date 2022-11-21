import { DevServerOptions } from '@modern-js/types';
import type { BuilderConfig } from '@modern-js/builder-webpack-provider';

// FIXME: need definition by itself.
type BuilderToolsConfig = Required<BuilderConfig>['tools'];
export type LegacyToolsUserConfig = BuilderToolsConfig & {
  esbuild?: Record<string, unknown>;
  devServer?: DevServerOptions;
};
