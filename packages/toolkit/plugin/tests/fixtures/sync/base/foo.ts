import { createPlugin } from '../core';
import { initFooPlugins } from './fooManager';

const foo = createPlugin(
  () => {
    const fooManage = initFooPlugins();

    return {
      // eslint-disable-next-line @typescript-eslint/require-await
      preDev: async () => {
        fooManage.fooWaterfall();
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      postDev: async () => {
        fooManage.fooWorflow();
      },
    };
  },
  { name: 'foo' },
);

export default foo;
