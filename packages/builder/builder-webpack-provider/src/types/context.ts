import type { BuilderContext } from '@modern-js/builder-shared';
import type { Hooks } from '../core/initHooks';
<<<<<<< HEAD
import type { BuilderConfig, NormalizedConfig } from './config';

/** The inner context. */
=======
import type { BuilderConfig } from './config';

/** The inner context */
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))
export type Context = BuilderContext & {
  /** All hooks. */
  hooks: Readonly<Hooks>;
  /** Current builder config. */
  config: Readonly<BuilderConfig>;
  /** The async task to validate schema of config. */
  configValidatingTask: Promise<void>;
  /** The original builder config passed from the createBuilder method. */
  originalConfig: Readonly<BuilderConfig>;
<<<<<<< HEAD
  /** The normalized builder config. */
  normalizedConfig?: Readonly<NormalizedConfig>;
=======
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))
};
