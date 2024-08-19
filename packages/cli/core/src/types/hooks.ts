import type {
  Workflow,
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
  ExtendHooks extends {} = {},
  ExtendUserConfig extends Record<string, any> = {},
  ExtendNormalizedConfig extends Record<string, any> = {},
> = {
  beforeConfig: AsyncWorkflow<void, void>;
  config: ParallelWorkflow<void, UserConfig<Extends>>;
  resolvedConfig: AsyncWaterfall<{
    resolved: NormalizedConfig<Extends>;
  }>;
  prepare: AsyncWorkflow<void, void>;
  afterPrepare: AsyncWorkflow<void, void>;
  watchFiles: ParallelWorkflow<
    void,
    // If the "private" is true, it will not restart cli.
    string[] | { files: string[]; isPrivate: boolean }
  >;
  fileChange: AsyncWorkflow<
    {
      filename: string;
      eventType: 'add' | 'change' | 'unlink';
      isPrivate: boolean;
    },
    void
  >;
  commands: AsyncWorkflow<{ program: Command }, void>;
  beforeExit: Workflow<void, void>;
  /**
   * @deprecated
   */
  addRuntimeExports: AsyncWaterfall<void>;
};

export type CliHooksRunner<
  Extends extends {
    hooks?: ExtendHooks;
    userConfig?: ExtendUserConfig;
    normalizedConfig?: ExtendNormalizedConfig;
  } = {},
  ExtendHooks extends {} = {},
  ExtendUserConfig extends Record<string, any> = {},
  ExtendNormalizedConfig extends Record<string, any> = {},
> = ToRunners<BaseHooks<Extends> & Extends['hooks']>;

export type CliHookCallbacks = ToThreads<BaseHooks<{}>>;

export interface DevToolData<DevOptions = any> {
  name: string;
  subCommands?: string[];
  menuItem?: {
    name: string;
    value: string;
  };
  // TODO: build watch
  // disableRunBuild?: boolean;
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
