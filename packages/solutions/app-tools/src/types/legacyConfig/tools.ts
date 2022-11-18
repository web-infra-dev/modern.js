import { DevServerOptions } from '@modern-js/types';
import type { BuilderConfig } from '@modern-js/builder-webpack-provider';

type BuilderToolsConfig = Required<BuilderConfig>['tools'];
export type LegacyToolsUserConfig = BuilderToolsConfig & {
  esbuild?: Record<string, unknown>;
  devServer?: DevServerOptions;
};
