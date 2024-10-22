import {
  createAsyncManager,
  createAsyncWaterfall,
  createAsyncWorkflow,
  createParallelWorkflow,
  createWorkflow,
} from '@modern-js/plugin';
import {
  setAppContext,
  useAppContext,
  useConfigContext,
  useResolvedConfigContext,
} from './context';
import type { BasePluginAPI } from './types';
import type { BaseHooks } from './types/hooks';

const baseHooks: BaseHooks<{}> = {
  beforeConfig: createAsyncWorkflow(),
  config: createParallelWorkflow(),
  resolvedConfig: createAsyncWaterfall(),
  prepare: createAsyncWorkflow(),
  afterPrepare: createAsyncWorkflow(),
  commands: createAsyncWorkflow(),
  watchFiles: createParallelWorkflow(),
  fileChange: createAsyncWorkflow(),
  beforeExit: createWorkflow(),
  addRuntimeExports: createAsyncWaterfall(),
};

const pluginAPI: BasePluginAPI<{}> = {
  setAppContext,
  useAppContext,
  useConfigContext,
  useResolvedConfigContext,
};

export const manager = createAsyncManager(baseHooks, pluginAPI);

export const { createPlugin, registerHook } = manager;
