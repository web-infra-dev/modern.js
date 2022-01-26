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
    console.info('asdas');
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
});
