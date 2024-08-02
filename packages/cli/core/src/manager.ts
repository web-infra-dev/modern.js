import {
  createWorkflow,
  createAsyncManager,
  createAsyncWorkflow,
  createAsyncWaterfall,
  createParallelWorkflow,
} from '@modern-js/plugin';
import { BaseHooks } from './types/hooks';
import { BasePluginAPI } from './types';
import {
  setAppContext,
  useAppContext,
  useConfigContext,
  useResolvedConfigContext,
} from './context';

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
