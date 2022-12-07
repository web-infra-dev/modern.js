import type {
  PluginStore,
  DefaultBuilderPluginAPI,
  BuilderPlugin as BaseBuilderPlugin,
} from '@modern-js/builder-shared';
import type { BuilderConfig, NormalizedConfig } from './config';
import type { WebpackConfig } from './thirdParty';
import type {
  ModifyWebpackChainFn,
  ModifyWebpackConfigFn,
  ModifyBuilderConfigFn,
  OnAfterCreateCompilerFn,
  OnBeforeCreateCompilerFn,
} from './hooks';

export interface BuilderPluginAPI
  extends DefaultBuilderPluginAPI<
    BuilderConfig,
    NormalizedConfig,
    WebpackConfig
  > {
  isPluginExists: PluginStore['isPluginExists'];
  /**
   * Get the relative paths of generated HTML files.
   * The key is entry name and the value is path.
   */
  getHTMLPaths: () => Record<string, string>;

  // Hooks
  onAfterCreateCompiler: (fn: OnAfterCreateCompilerFn) => void;
  onBeforeCreateCompiler: (fn: OnBeforeCreateCompilerFn) => void;

  // Modifiers
  modifyWebpackChain: (fn: ModifyWebpackChainFn) => void;
  modifyWebpackConfig: (fn: ModifyWebpackConfigFn) => void;
  modifyBuilderConfig: (fn: ModifyBuilderConfigFn) => void;
}

export type BuilderPlugin = BaseBuilderPlugin<BuilderPluginAPI>;
