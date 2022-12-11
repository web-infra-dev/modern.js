import type {
  DefaultBuilderPluginAPI,
  BuilderPlugin as BaseBuilderPlugin,
} from '@modern-js/builder-shared';
import type { BuilderConfig, NormalizedConfig } from './config';
import type { ModifyRspackConfigFn } from './hooks';
import type { Compiler, RspackConfig } from './rspack';

export interface BuilderPluginAPI
  extends DefaultBuilderPluginAPI<
    BuilderConfig,
    NormalizedConfig,
    RspackConfig,
    Compiler
  > {
  modifyRspackConfig: (fn: ModifyRspackConfigFn) => void;
}

export type BuilderPlugin = BaseBuilderPlugin<BuilderPluginAPI>;
