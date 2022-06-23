import { manager } from '@modern-js/core';
import { program } from '@modern-js/utils';
import { buildCli } from '../src/cli/build';
import plugin from '../src';

jest.mock('../src/features/build/normalize', () => {
  const originalModule = jest.requireActual('../src/features/build/normalize');

  return {
    __esModule: true,
    ...originalModule,
    normalizeModuleConfig: (...args: any[]) => {
      const ret = originalModule.normalizeModuleConfig(...args)
      expect(ret).toMatchSnapshot();
      return ret;
    }
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
  it('without build-preset and build-config', async () => {
    const mockAPI = {
      useAppContext: jest.fn((): any => ({
        appDirectory: '',
      })),
      useResolvedConfigContext: jest.fn((): any => ({
        source: {},
        output: {},
        tools: {},
      })),
    };
    const cloned = manager.clone(mockAPI);
    cloned.usePlugin({
      async setup(api) {
        buildCli(program, api);
        program.parse(['', '', 'build']);
      },
    });
    await cloned.init();
  })
});
