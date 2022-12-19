import type {
  DefaultBuilderPluginAPI,
  BuilderPlugin as BaseBuilderPlugin,
} from '@modern-js/builder-shared';
import type { Compiler, MultiCompiler } from 'webpack';
import type { BuilderConfig, NormalizedConfig } from './config';
import type { WebpackConfig } from './thirdParty';
import type { ModifyWebpackChainFn, ModifyWebpackConfigFn } from './hooks';

export interface BuilderPluginAPI
  extends DefaultBuilderPluginAPI<
    BuilderConfig,
    NormalizedConfig,
    WebpackConfig,
    Compiler | MultiCompiler
  > {
  // Modifiers
  modifyWebpackChain: (fn: ModifyWebpackChainFn) => void;
  modifyWebpackConfig: (fn: ModifyWebpackConfigFn) => void;
}

export type BuilderPlugin = BaseBuilderPlugin<BuilderPluginAPI>;
