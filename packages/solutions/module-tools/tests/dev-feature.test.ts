import { runSubCmd } from '../src/features/dev';

const mockModuleToolsMenu = jest.fn();
const mockDevMeta = jest.fn();
const exit = jest.spyOn(process, 'exit').mockImplementation();
jest.mock('@modern-js/core', () => ({
  __esModule: true,
  mountHook: jest.fn(() => ({
    moduleToolsMenu: mockModuleToolsMenu,
  })),
}));

describe('dev feature with subCmd', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should run task with "storybook" params when storybook plugin exist', async () => {
    mockModuleToolsMenu.mockReturnValue([
      { value: 'storybook', runTask: mockDevMeta },
    ]);
    await runSubCmd('storybook', { isTsProject: true, appDirectory: '' });
    expect(mockDevMeta.mock.calls.length).toBe(1);
  });

  it('should run task with "storybook" params when storybook plugin not exist', async () => {
    mockModuleToolsMenu.mockReturnValue([]);
    await runSubCmd('storybook', { isTsProject: true, appDirectory: '' });
    expect(exit).toHaveBeenCalled();
  });

  it('should run task with alias name "story" params when storybook plugin exist', async () => {
    mockModuleToolsMenu.mockReturnValue([
      { value: 'storybook', aliasValues: ['story'], runTask: mockDevMeta },
    ]);
    await runSubCmd('story', { isTsProject: true, appDirectory: '' });
    expect(mockDevMeta.mock.calls.length).toBe(1);
  });

  it('should run task with alias name "story1" params when storybook plugin exist', async () => {
    mockModuleToolsMenu.mockReturnValue([
      { value: 'storybook', aliasValues: ['story'], runTask: mockDevMeta },
    ]);
    await runSubCmd('story1', { isTsProject: true, appDirectory: '' });
    expect(mockDevMeta.mock.calls.length).toBe(0);
  });
});
