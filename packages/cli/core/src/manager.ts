import {
  ToRunners,
  AsyncWorkflow,
  AsyncWaterfall,
  ParallelWorkflow,
  createAsyncManager,
  createAsyncWorkflow,
  createAsyncWaterfall,
  createParallelWorkflow,
} from '@modern-js/plugin';
import { compatRequire } from '@modern-js/utils';
import type { Hooks } from '@modern-js/types';
import type { Command } from './utils/commander';
import type { NormalizedConfig } from './config/mergeConfig';
import { pluginAPI, PluginAPI } from './pluginAPI';

export type HooksRunner = ToRunners<{
  config: ParallelWorkflow<void>;
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
  config: createParallelWorkflow(),
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

export const manager = createAsyncManager<typeof baseHooks & Hooks, PluginAPI>(
  baseHooks,
  pluginAPI,
);

// TODO: remove export after refactor all plugins
export const { createPlugin, registerHook, useRunner: mountHook } = manager;

export const usePlugins = (plugins: string[]) =>
  plugins.forEach(plugin =>
    manager.usePlugin(compatRequire(require.resolve(plugin))),
  );
