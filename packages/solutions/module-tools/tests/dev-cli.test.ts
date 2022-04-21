import { manager } from '@modern-js/core';
import { program } from '@modern-js/utils';
import { devCli } from '../src/cli/dev';

const mockCommandDev = jest.fn();

describe('dev cli subCmd', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mock('../src/commands', () => ({
      __esModule: true,
      dev: mockCommandDev,
    }));
  });
  it('should be storybook with "dev storybook"', async () => {
    const mockAPI = {
      useAppContext: jest.fn((): any => ({
        distDirectory: '',
      })),
      useResolvedConfigContext: jest.fn(),
      useHookRunners: (): any => ({}),
    };
    const cloned = manager.clone(mockAPI);
    cloned.usePlugin({
      setup(api) {
        devCli(program, api);
        program.parse(['', '', 'dev', 'storybook']);
        expect(mockCommandDev.mock.calls[0][2]).toBe('storybook');
      },
    });
    await cloned.init();
  });

  it('should be undefined with "dev"', async () => {
    const mockBeforeBuild = jest.fn();
    const mockAfterBuild = jest.fn();
    const mockAPI = {
      useAppContext: jest.fn((): any => ({
        distDirectory: '',
      })),
      useResolvedConfigContext: jest.fn(),
      useHookRunners: (): any => ({
        afterBuild: mockAfterBuild,
        beforeBuild: mockBeforeBuild,
      }),
    };
    const cloned = manager.clone(mockAPI);
    cloned.usePlugin({
      setup(api) {
        devCli(program, api);
        program.parse(['', '', 'dev']);
        expect(mockCommandDev.mock.calls[0][2]).toBe(undefined);
      },
    });
    await cloned.init();
  });
});
