import { createPlugin } from '../core';
import { initFooPlugins } from './fooManager';

const foo = createPlugin(
  () => {
    const fooManage = initFooPlugins();

    return {
      preDev: async () => {
        fooManage.fooWaterfall();
      },
      postDev: async () => {
        fooManage.fooWorflow();
      },
    };
  },
  { name: 'foo' },
);

export default foo;
