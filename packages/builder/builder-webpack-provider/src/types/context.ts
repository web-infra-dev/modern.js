import type { SharedBuilderContext } from '@modern-js/builder-shared';
import type { Hooks } from '../core/initHooks';
import type { BuilderConfig, NormalizedConfig } from './config';
import type { BuilderPluginAPI } from './plugin';

export type BuilderContext = SharedBuilderContext & {
  /** All hooks. */
  hooks: Readonly<Hooks>;
};

/** The inner context. */
export type Context = BuilderContext & {
  /** All hooks. */
  hooks: Readonly<Hooks>;
  /** Current builder config. */
  config: Readonly<BuilderConfig>;
  /** The async task to validate schema of config. */
  configValidatingTask: Promise<void>;
  /** The original builder config passed from the createBuilder method. */
  originalConfig: Readonly<BuilderConfig>;
  /** The normalized builder config. */
  normalizedConfig?: NormalizedConfig;
  /** The plugin API. */
  pluginAPI?: BuilderPluginAPI;
};
