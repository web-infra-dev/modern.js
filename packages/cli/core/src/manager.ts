import {
  ToThreads,
  ToRunners,
  AsyncSetup,
  PluginOptions,
  AsyncWorkflow,
  AsyncWaterfall,
  ParallelWorkflow,
  createAsyncManager,
  createAsyncWorkflow,
  createAsyncWaterfall,
  createParallelWorkflow,
} from '@modern-js/plugin';
import type { Hooks } from './types';
import type { Command } from './utils/commander';
import type { NormalizedConfig } from './config/mergeConfig';
import type { UserConfig } from './config';
import { pluginAPI } from './pluginAPI';

export type HooksRunner = ToRunners<{
  config: ParallelWorkflow<void, UserConfig>;
  resolvedConfig: AsyncWaterfall<{
    resolved: NormalizedConfig;
  }>;
  validateSchema: ParallelWorkflow<void>;
  prepare: AsyncWorkflow<void, void>;
  commands: AsyncWorkflow<
    {
      program: Command;
    },
    void
  >;
  watchFiles: ParallelWorkflow<void>;
  fileChange: AsyncWorkflow<
    {
      filename: string;
      eventType: 'add' | 'change' | 'unlink';
    },
    void
  >;
  beforeExit: AsyncWorkflow<void, void>;
  beforeRestart: AsyncWorkflow<void, void>;
}>;

const baseHooks = {
  config: createParallelWorkflow<void, UserConfig>(),
  resolvedConfig: createAsyncWaterfall<{
    resolved: NormalizedConfig;
  }>(),
  validateSchema: createParallelWorkflow(),
  prepare: createAsyncWorkflow<void, void>(),
  commands: createAsyncWorkflow<
    {
      program: Command;
    },
    void
  >(),
  watchFiles: createParallelWorkflow(),
  fileChange: createAsyncWorkflow<
    {
      filename: string;
      eventType: 'add' | 'change' | 'unlink';
    },
    void
  >(),
  beforeExit: createAsyncWorkflow<void, void>(),
  beforeRestart: createAsyncWorkflow<void, void>(),
};

/** All hooks of cli plugin. */
export type CliHooks = typeof baseHooks & Hooks;

/** All hook callbacks of cli plugin. */
export type CliHookCallbacks = ToThreads<CliHooks>;

export const manager = createAsyncManager<CliHooks, typeof pluginAPI>(
  baseHooks,
  pluginAPI,
);

/** Plugin options of a cli plugin. */
// eslint-disable-next-line @typescript-eslint/ban-types
export type CliPlugin<ExtendHooks = {}> = PluginOptions<
  CliHooks,
  AsyncSetup<CliHooks & ExtendHooks, typeof pluginAPI>,
  ExtendHooks
>;

export const { createPlugin, registerHook, useRunner: mountHook } = manager;
