import { DevToolData as BaseDevToolData } from '@modern-js/plugin';
import { registerHook } from '../hooks';
import type { BaseBuildConfig, BuildConfig } from './config';
import type { DevCommandOptions } from './command';

export interface BuildTaskResult {
  status: 'success' | 'fail';
  message?: string;
  config: BaseBuildConfig;
}

export interface BuildResult {
  status: 'success' | 'fail';
  message?: string;
  config: BuildConfig;
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
