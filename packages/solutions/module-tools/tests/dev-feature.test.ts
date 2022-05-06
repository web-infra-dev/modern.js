import { manager } from '@modern-js/core';
import { runSubCmd } from '../src/features/dev';

const mockModuleToolsMenu = jest.fn();
const mockDevMeta = jest.fn();
const exit = jest.spyOn(process, 'exit').mockImplementation();
const mockAPI = {
  useAppContext: jest.fn((): any => ({})),
  useResolvedConfigContext: jest.fn(),
  useHookRunners: (): any => ({
    moduleToolsMenu: mockModuleToolsMenu,
  }),
};

describe('dev feature with subCmd', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should run task with "storybook" params when storybook plugin exist', async () => {
    mockModuleToolsMenu.mockReturnValue([
      { value: 'storybook', runTask: mockDevMeta },
    ]);
    const cloned = manager.clone(mockAPI);
    cloned.usePlugin({
      async setup(api) {
        await runSubCmd(api, 'storybook', {
          isTsProject: true,
          appDirectory: '',
        });
        expect(mockDevMeta.mock.calls.length).toBe(1);
      },
    });
    await cloned.init();
  });

  it('should run task with "storybook" params when storybook plugin not exist', async () => {
    mockModuleToolsMenu.mockReturnValue([]);
    const cloned = manager.clone(mockAPI);
    cloned.usePlugin({
      async setup(api) {
        await runSubCmd(api, 'storybook', {
          isTsProject: true,
          appDirectory: '',
        });
        expect(exit).toHaveBeenCalled();
      },
    });
    await cloned.init();
  });

  it('should run task with alias name "story" params when storybook plugin exist', async () => {
    mockModuleToolsMenu.mockReturnValue([
      { value: 'storybook', aliasValues: ['story'], runTask: mockDevMeta },
    ]);
    const cloned = manager.clone(mockAPI);
    cloned.usePlugin({
      async setup(api) {
        await runSubCmd(api, 'story', { isTsProject: true, appDirectory: '' });
        expect(mockDevMeta.mock.calls.length).toBe(1);
      },
    });
    await cloned.init();
  });

  it('should run task with alias name "story1" params when storybook plugin exist', async () => {
    mockModuleToolsMenu.mockReturnValue([
      { value: 'storybook', aliasValues: ['story'], runTask: mockDevMeta },
    ]);
    const cloned = manager.clone(mockAPI);
    cloned.usePlugin({
      async setup(api) {
        await runSubCmd(api, 'story1', { isTsProject: true, appDirectory: '' });
        expect(mockDevMeta.mock.calls.length).toBe(0);
      },
    });
    await cloned.init();
  });
});
