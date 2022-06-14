import { manager } from '@modern-js/core';
import { program } from '@modern-js/utils';
import { buildCli } from '../src/cli/build';

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
describe('build cli in module tools', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mock('../src/features/build/normalize', () => {
      const originalModule = jest.requireActual('../src/features/build/normalize');

      return {
        __esModule: true,
        ...originalModule,
        normalizeModuleConfig: (...args: any[]) => {
          const ret = originalModule.normalizeModuleConfig(...args)
          expect(ret[0].dts).toEqual(false);
          return ret;
        }
      };
    });
  });
  it('disable dts', async () => {
    const cloned = manager.clone(mockAPI);
    cloned.usePlugin({
      async setup(api) {
        buildCli(program, api);
        program.parse(['', '', 'build', '--no-dts']);
      },
    });
    await cloned.init();
  });

});
