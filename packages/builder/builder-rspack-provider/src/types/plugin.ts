import type {
  DefaultBuilderPluginAPI,
  BuilderPlugin as BaseBuilderPlugin,
  ModifyBundlerChainFn,
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
  modifyBundlerChain: (fn: ModifyBundlerChainFn) => void;
}

export type BuilderPlugin = BaseBuilderPlugin<BuilderPluginAPI>;
