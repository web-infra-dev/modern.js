import {
  createParallelWorkflow,
  createAsyncWaterfall,
} from '@modern-js/plugin';
import type { RegisterBuildPlatformResult } from '@modern-js/core';
import { BuildCommandOptions } from '../types';
import type { BuildConfig, BaseBuildConfig } from '../types/config';
import type {
  BuildTaskResult,
  BuildResult,
  BuildPlatformResult,
  WatchDtsHookContext,
  WatchJsHookContext,
} from '../types/hooks';

export const buildHooks = {
  beforeBuild: createParallelWorkflow<
    { config: BuildConfig; cliOptions: BuildCommandOptions },
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
