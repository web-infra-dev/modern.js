import type { BuilderContext, DeepReadonly } from '@modern-js/builder-shared';
import type { Hooks } from '../core/initHooks';
import type { BuilderConfig, NormalizedConfig } from './config';
import type { BuilderPluginAPI } from './plugin';

/** The inner context. */
export type Context = BuilderContext & {
  /** All hooks. */
  hooks: Readonly<Hooks>;
  /** Current builder config. */
  config: DeepReadonly<BuilderConfig>;
  /** The async task to validate schema of config. */
  configValidatingTask: Promise<void>;
  /** The original builder config passed from the createBuilder method. */
  originalConfig: DeepReadonly<BuilderConfig>;
  /** The normalized builder config. */
  normalizedConfig?: DeepReadonly<NormalizedConfig>;
  /** The plugin API. */
  pluginAPI?: BuilderPluginAPI;
};
