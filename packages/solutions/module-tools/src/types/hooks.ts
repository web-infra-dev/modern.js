import type { DevToolData as BaseDevToolData } from '@modern-js/core';
import type { registerHook } from '../hooks';
import type { BuildCommandOptions, DevCommandOptions } from './command';
import type { BaseBuildConfig, BuildConfig, BuildType } from './config';

export interface BuildTaskResult {
  status: 'success' | 'fail';
  message?: string;
  config: BaseBuildConfig;
}

export interface BuildResult {
  status: 'success' | 'fail';
  message?: string;
  config: BuildConfig;
  commandOptions: BuildCommandOptions;
  totalDuration: number;
}
export interface BuildPlatformResult {
  status: 'success' | 'fail';
  message: string | Error | null;
}

export type DevToolData = BaseDevToolData<DevCommandOptions>;

export type PromptResult = { choiceDevTool: string } & Record<string, any>;

export type ModuleToolsHooks = typeof registerHook;

export interface WatchJsHookContext {
  buildConfig: BaseBuildConfig;
}

export interface WatchDtsHookContext {
  buildType: BuildType;
}
