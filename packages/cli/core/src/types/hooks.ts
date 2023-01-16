import {
  ParallelWorkflow,
  AsyncWaterfall,
  AsyncWorkflow,
  ToRunners,
  ToThreads,
} from '@modern-js/plugin';
import type { Command } from '@modern-js/utils';
import type { UserConfig, NormalizedConfig } from './config';

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
  config: ParallelWorkflow<void, UserConfig<Extends>>;
  resolvedConfig: AsyncWaterfall<{
    resolved: NormalizedConfig<Extends>;
  }>;
  validateSchema: ParallelWorkflow<void>;
  prepare: AsyncWorkflow<void, void>;
  afterPrepare: AsyncWorkflow<void, void>;
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

export interface DevToolData<DevOptions = any> {
  name: string;
  subCommands?: string[];
  menuItem?: {
    name: string;
    value: string;
  };
  disableRunBuild?: boolean;
  action: (
    options: DevOptions,
    context: { isTsProject?: boolean },
  ) => void | Promise<void>;
}

export interface RegisterBuildPlatformResult {
  platform: string | string[];
  build: (
    currentPlatform: string,
    context: { isTsProject: boolean },
  ) => void | Promise<void>;
}
