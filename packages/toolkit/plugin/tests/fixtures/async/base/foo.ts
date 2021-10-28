import { createPlugin } from '../core';
import { initFooPlugins } from './fooManager';

const foo = createPlugin(
  async () => {
    const fooManage = initFooPlugins();

    return {
      preDev: () => {
        fooManage.fooWaterfall();
      },
      postDev: () => {
        fooManage.fooWorflow();
      },
    };
  },
  { name: 'foo' },
);

export default foo;
