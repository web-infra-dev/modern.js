import { DevToolData as BaseDevToolData } from '@modern-js/core';
import { registerHook } from '../hooks';
import type { BaseBuildConfig, BuildConfig, BuildType } from './config';
import type { DevCommandOptions, BuildCommandOptions } from './command';

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
