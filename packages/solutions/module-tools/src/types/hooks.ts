import { DevToolData as BaseDevToolData } from '@modern-js/core';
import { registerHook } from '../hooks';
import type { BaseBuildConfig, BuildConfig } from './config';
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
  message: string;
}

export type DevToolData = BaseDevToolData<DevCommandOptions>;

export type PromptResult = { choiceDevTool: string | symbol } & Record<
  string,
  any
>;

export type ModuleToolsHooks = typeof registerHook;
