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
export interface RegisterBuildPlatformResult {
  platform: string | string[];
  build: (currentPlatform: string) => void | Promise<void>;
}
export interface BuildPlatformResult {
  status: 'success' | 'fail';
  message: string;
}

export interface DevToolData {
  name: string;
  subCommands?: string[];
  menuItem?: {
    name: string;
    value: string;
  };
  action: (options: DevCommandOptions) => void | Promise<void>;
}

export type PromptResult = { choiceDevTool: string | symbol } & Record<
  string,
  any
>;

export type ModuleToolsHooks = typeof registerHook;
