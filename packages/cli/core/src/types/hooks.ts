import {
  ParallelWorkflow,
  AsyncWaterfall,
  AsyncWorkflow,
  ToRunners,
  ToThreads,
} from '@modern-js/plugin';
import type { Command } from '@modern-js/utils';
import type { CliUserConfig, CliNormalizedConfig } from './config';

export type BaseHooks<
  Extends extends {
    hooks?: ExtendHooks;
    userConfig?: ExtendUserConfig;
    normalizedConfig?: ExtendNormalizedConfig;
  },
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtendHooks extends {} = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtendUserConfig extends Record<string, any> = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtendNormalizedConfig extends Record<string, any> = {},
> = {
  config: ParallelWorkflow<void, CliUserConfig<Extends>>;
  resolvedConfig: AsyncWaterfall<{
    resolved: CliNormalizedConfig<Extends>;
  }>;
  validateSchema: ParallelWorkflow<void>;
  prepare: AsyncWorkflow<void, void>;
  commands: AsyncWorkflow<{ program: Command }, void>;
  beforeExit: AsyncWorkflow<void, void>;
  addRuntimeExports: AsyncWaterfall<void>;
};

export type CliHooksRunner<
  Extends extends {
    hooks?: ExtendHooks;
    userConfig?: ExtendUserConfig;
    normalizedConfig?: ExtendNormalizedConfig;
    // eslint-disable-next-line @typescript-eslint/ban-types
  } = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtendHooks extends {} = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtendUserConfig extends Record<string, any> = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtendNormalizedConfig extends Record<string, any> = {},
> = ToRunners<BaseHooks<Extends> & Extends['hooks']>;

// eslint-disable-next-line @typescript-eslint/ban-types
export type CliHookCallbacks = ToThreads<BaseHooks<{}>>;
