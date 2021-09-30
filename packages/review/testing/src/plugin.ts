import {
  createManager,
  createAsyncPipeline,
  PluginFromManager,
} from '@modern-js/plugin';
import { TestConfigOperator } from './config/testConfigOperator';

const jestConfig = createAsyncPipeline<
  TestConfigOperator,
  TestConfigOperator
>();

const manager = createManager({ jestConfig });

const { createPlugin } = manager;

export const createLifeCycle = (plugins?: any[]) => {
  // todo: remove manager. @tianqi
  const _manager = manager || createManager({ jestConfig });

  plugins && _manager.usePlugin(...plugins);

  return _manager.init();
};

export type Plugin = PluginFromManager<typeof manager>;

export { createPlugin };
