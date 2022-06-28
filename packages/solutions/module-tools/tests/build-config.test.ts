import { manager } from '@modern-js/core';
import plugin from '../src';

jest.mock('../src/features/build/normalize', () => {
  const originalModule = jest.requireActual('../src/features/build/normalize');

  return {
    __esModule: true,
    ...originalModule,
    normalizeModuleConfig: (...args: any[]) => {
      const ret = originalModule.normalizeModuleConfig(...args);
      expect(ret).toMatchSnapshot();
      return ret;
    },
  };
});

describe('config in module tools', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('schema', async () => {
    const main = manager.clone().usePlugin(plugin);
    const runner = await main.init();
    const result = await runner.validateSchema();
    expect(result).toMatchSnapshot();
  });
  it('default user config', async () => {
    const main = manager.clone().usePlugin(plugin);
    const runner = await main.init();
    const result = await runner.config();

    expect(result).toMatchSnapshot();
  });
});
