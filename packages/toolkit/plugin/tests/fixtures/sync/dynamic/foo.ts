import { createAsyncWaterfall } from '../../../../src';
import { createPlugin, registeManager, useRunner } from '../core';

// declare new lifecircle type
declare module '../core' {
  interface ExternalProgress {
    fooWaterfall: typeof fooWaterfall;
  }
}

// create new manage model of new lifecircle 新生命周期运行管理模型创建
const fooWaterfall = createAsyncWaterfall();

const foo = createPlugin(() => {
  // registe new lifecircle
  registeManager({ fooWaterfall });

  return {
    preDev: () => {
      // run new lifecircle
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useRunner().fooWaterfall();
    },
  };
});

export default foo;
