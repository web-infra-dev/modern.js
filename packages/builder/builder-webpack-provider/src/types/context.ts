import type { BuilderContext } from '@modern-js/builder-shared';
import type { Hooks } from '../core/initHooks';
import type { BuilderConfig } from './config';

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
};
