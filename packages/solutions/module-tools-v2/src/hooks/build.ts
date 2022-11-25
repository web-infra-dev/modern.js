import { createParallelWorkflow } from '@modern-js/plugin';
import { BuildCommandOptions } from '../types';
import type { BuildConfig, BaseBuildConfig } from '../types/config';
import type {
  BuildTaskResult,
  BuildResult,
  RegisterBuildPlatformResult,
  BuildPlatformResult,
} from '../types/hooks';

export const buildHooks = {
  beforeBuild: createParallelWorkflow<
    { config: BuildConfig; options: BuildCommandOptions },
    BuildConfig
  >(),
  beforeBuildTask: createParallelWorkflow<
    { config: BaseBuildConfig; options: BuildCommandOptions },
    BaseBuildConfig
  >(),
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
  buildPlatform: createParallelWorkflow<
    { platform: string },
    Pick<RegisterBuildPlatformResult, 'build'>
  >(),
  afterBuildPlatform: createParallelWorkflow<void, BuildPlatformResult>(),
};
