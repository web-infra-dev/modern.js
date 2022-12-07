import type {
  PluginStore,
  DefaultBuilderPluginAPI,
  BuilderPlugin as BaseBuilderPlugin,
} from '@modern-js/builder-shared';
import type { BuilderConfig, NormalizedConfig } from './config';
import type {
  ModifyRspackConfigFn,
  ModifyBuilderConfigFn,
  OnAfterCreateCompilerFn,
  OnBeforeCreateCompilerFn,
} from './hooks';
import type { RspackConfig } from './rspack';

export interface BuilderPluginAPI
  extends DefaultBuilderPluginAPI<
    BuilderConfig,
    NormalizedConfig,
    RspackConfig
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
  modifyRspackConfig: (fn: ModifyRspackConfigFn) => void;
  modifyBuilderConfig: (fn: ModifyBuilderConfigFn) => void;
}

export type BuilderPlugin = BaseBuilderPlugin<BuilderPluginAPI>;
