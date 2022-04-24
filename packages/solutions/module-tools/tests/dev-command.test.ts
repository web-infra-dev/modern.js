import { manager } from '@modern-js/core';
import { dev } from '../src/commands/dev';

const mockRunSubCmd = jest.fn();
jest.mock('../src/features/dev', () => ({
  __esModule: true,
  runSubCmd: mockRunSubCmd,
  devStorybook: jest.fn(),
}));

jest.mock('../src/utils/valide', () => ({
  __esModule: true,
  valideBeforeTask: jest.fn(),
}));

jest.mock('../src/utils/tsconfig', () => ({
  __esModule: true,
  existTsConfigFile: jest.fn(),
}));

describe('dev command with subCmd', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should call runSubCmd with storybook param', async () => {
    const mockAPI = {
      useAppContext: jest.fn((): any => ({
        distDirectory: '',
        appDirectory: '',
      })),
      useResolvedConfigContext: jest.fn(),
    };

    const cloned = manager.clone(mockAPI);
    cloned.usePlugin({
      async setup(api) {
        await dev(api, { tsconfig: 'tsconfig.json' }, 'storybook');
        expect(mockRunSubCmd.mock.calls.length).toBe(1);
        expect(mockRunSubCmd.mock.calls[0][1]).toBe('storybook');
      },
    });
    await cloned.init();
  });

  it('should not call runSubCmd with nothing param', async () => {
    const mockAPI = {
      useAppContext: jest.fn((): any => ({
        distDirectory: '',
        appDirectory: '',
      })),
      useResolvedConfigContext: jest.fn(),
    };

    const cloned = manager.clone(mockAPI);
    cloned.usePlugin({
      async setup(api) {
        await dev(api, { tsconfig: 'tsconfig.json' });
        expect(mockRunSubCmd.mock.calls.length).toBe(0);
      },
    });
    await cloned.init();
  });
});
