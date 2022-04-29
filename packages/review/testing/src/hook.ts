import { createAsyncPipeline, createParallelWorkflow } from '@modern-js/plugin';
import { TestConfigOperator } from './config/testConfigOperator';

export const jestConfigHook = createAsyncPipeline<
  TestConfigOperator,
  TestConfigOperator
>();

export const afterTestHook = createParallelWorkflow();

export const testingHooks = {
  jestConfig: createAsyncPipeline<TestConfigOperator, TestConfigOperator>(),
  afterTest: createParallelWorkflow(),
};

declare module '@modern-js/core' {
  export interface Hooks {
    jestConfig: typeof jestConfigHook;
    afterTest: typeof afterTestHook;
  }
}
