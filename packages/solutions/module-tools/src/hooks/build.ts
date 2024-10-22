import type { RegisterBuildPlatformResult } from '@modern-js/core';
import {
  createAsyncWaterfall,
  createParallelWorkflow,
} from '@modern-js/plugin';
import type { BuildCommandOptions } from '../types';
import type {
  BaseBuildConfig,
  BuildPlatformResult,
  BuildResult,
  BuildTaskResult,
  WatchDtsHookContext,
  WatchJsHookContext,
} from '../types';

export const buildHooks = {
  beforeBuild: createParallelWorkflow<
    { config: BaseBuildConfig[]; cliOptions: BuildCommandOptions },
    void
  >(),
  beforeBuildTask: createAsyncWaterfall<BaseBuildConfig>(),
  afterBuildTask: createParallelWorkflow<BuildTaskResult, void>(),
  afterBuild: createParallelWorkflow<BuildResult, void>(),
  registerBuildPlatform: createParallelWorkflow<
    void,
    RegisterBuildPlatformResult
  >(),
  beforeBuildPlatform: createParallelWorkflow<
    RegisterBuildPlatformResult[],
    void
  >(),
  buildPlatform: createParallelWorkflow<{ platform: string }, void>(),
  afterBuildPlatform: createParallelWorkflow<BuildPlatformResult, void>(),
};

export const buildWatchHooks = {
  buildWatchJs: createParallelWorkflow<WatchJsHookContext, void>(),
  buildWatchDts: createParallelWorkflow<WatchDtsHookContext, void>(),
};
