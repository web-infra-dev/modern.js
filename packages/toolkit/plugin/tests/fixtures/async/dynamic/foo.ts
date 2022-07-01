import { createAsyncWaterfall } from '../../../../src';
import { createPlugin, registerHook, useRunner } from '../core';

// declare new lifecycle type
declare module '../core' {
  interface ExternalProgress {
    fooWaterfall: typeof fooWaterfall;
  }
}

// create new manage model of new lifecycle 新生命周期运行管理模型创建
const fooWaterfall = createAsyncWaterfall();

const foo = createPlugin(() => {
  // register new lifecycle
  registerHook({ fooWaterfall });

  return {
    preDev: () => {
      // run new lifecycle
      useRunner().fooWaterfall();
    },
  };
});

export default foo;
