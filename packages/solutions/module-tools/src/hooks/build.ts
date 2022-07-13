import { createParallelWorkflow, createAsyncPipeline } from '@modern-js/plugin';
import {
  registerHook,
  NormalizedConfig,
  LessOption,
  SassOption,
  PostcssOption,
} from '@modern-js/core';
import { CompilerItem, PostcssCompilerItem } from '../style-compiler';

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
  { modernConfig: NormalizedConfig },
  LessOption | undefined
>();

export const moduleSassConfig = createAsyncPipeline<
  { modernConfig: NormalizedConfig },
  SassOption | undefined
>();

export const modulePostcssConfig = createAsyncPipeline<
  { modernConfig: NormalizedConfig; appDirectory: string },
  PostcssOption | undefined
>();

export const moduleTailwindConfig = createAsyncPipeline<
  { modernConfig: NormalizedConfig },
  any
>();

export const getModuleLessCompiler = createAsyncPipeline<
  unknown,
  CompilerItem | undefined
>();

export const getModuleSassCompiler = createAsyncPipeline<
  unknown,
  CompilerItem | undefined
>();

export const getModulePostcssCompiler = createAsyncPipeline<
  unknown,
  PostcssCompilerItem | undefined
>();

export const buildHooks = {
  platformBuild,
  moduleLessConfig,
  getModuleLessCompiler,
  moduleSassConfig,
  getModuleSassCompiler,
  modulePostcssConfig,
  getModulePostcssCompiler,
  moduleTailwindConfig,
};

export const lifecycle = () => {
  registerHook({
    moduleLessConfig,
    getModuleLessCompiler,
    moduleSassConfig,
    getModuleSassCompiler,
    modulePostcssConfig,
    getModulePostcssCompiler,
    moduleTailwindConfig,
    platformBuild,
  });
};

declare module '@modern-js/core' {
  export interface Hooks {
    platformBuild: typeof platformBuild;
    moduleLessConfig: typeof moduleLessConfig;
    getModuleLessCompiler: typeof getModuleLessCompiler;
    moduleSassConfig: typeof moduleSassConfig;
    getModuleSassCompiler: typeof getModuleSassCompiler;
    modulePostcssConfig: typeof modulePostcssConfig;
    getModulePostcssCompiler: typeof getModulePostcssCompiler;
    moduleTailwindConfig: typeof moduleTailwindConfig;
  }
}
