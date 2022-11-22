import { createParallelWorkflow, createAsyncPipeline } from '@modern-js/plugin';
import { registerHook, CliNormalizedConfig } from '@modern-js/core';
import { LessOption, SassOptions } from '@modern-js/style-compiler';

export interface PlatformBuildOption {
  isTsProject: boolean;
}

export const platformBuild = createParallelWorkflow<
  PlatformBuildOption,
  {
    name: string;
    title: string;
    taskPath: string;
    params: string[];
  }
>();

export const moduleLessConfig = createAsyncPipeline<
  { modernConfig: CliNormalizedConfig<any> },
  LessOption | undefined
>();

export const moduleSassConfig = createAsyncPipeline<
  { modernConfig: CliNormalizedConfig<any> },
  SassOptions<'sync'> | undefined
>();

export const moduleTailwindConfig = createAsyncPipeline<
  { modernConfig: CliNormalizedConfig<any> },
  any
>();

export const buildHooks = {
  platformBuild,
  moduleLessConfig,
  moduleSassConfig,
  moduleTailwindConfig,
};

export const lifecycle = () => {
  registerHook({
    moduleLessConfig,
    moduleSassConfig,
    moduleTailwindConfig,
    platformBuild,
  } as any);
};

declare module '@modern-js/core' {
  export interface Hooks {
    platformBuild: typeof platformBuild;
    moduleLessConfig: typeof moduleLessConfig;
    moduleSassConfig: typeof moduleSassConfig;
    moduleTailwindConfig: typeof moduleTailwindConfig;
  }
}
