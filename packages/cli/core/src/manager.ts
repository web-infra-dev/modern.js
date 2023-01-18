import {
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

// eslint-disable-next-line @typescript-eslint/ban-types
const baseHooks: BaseHooks<{}> = {
  config: createParallelWorkflow(),
  resolvedConfig: createAsyncWaterfall(),
  validateSchema: createParallelWorkflow(),
  prepare: createAsyncWorkflow(),
  afterPrepare: createAsyncWorkflow(),
  commands: createAsyncWorkflow(),
  watchFiles: createParallelWorkflow(),
  fileChange: createAsyncWorkflow(),
  beforeExit: createAsyncWorkflow(),
  addRuntimeExports: createAsyncWaterfall(),
};
// eslint-disable-next-line @typescript-eslint/ban-types
const pluginAPI: BasePluginAPI<{}> = {
  setAppContext,
  useAppContext,
  useConfigContext,
  useResolvedConfigContext,
};

export const manager = createAsyncManager(baseHooks, pluginAPI);

export const { createPlugin, registerHook, useRunner: mountHook } = manager;
