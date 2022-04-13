import { createAsyncPipeline } from '@modern-js/plugin';
import { TestConfigOperator } from './config/testConfigOperator';

export const jestConfigHook = createAsyncPipeline<
  TestConfigOperator,
  TestConfigOperator
>();

declare module '@modern-js/core' {
  export interface Hooks {
    jestConfig: typeof jestConfigHook;
  }
}
