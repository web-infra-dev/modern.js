import { dev } from '../src/commands/dev';

const mockRunSubCmd = jest.fn();
jest.mock('../src/features/dev', () => ({
  __esModule: true,
  runSubCmd: mockRunSubCmd,
  devStorybook: jest.fn(),
}));
jest.mock('@modern-js/core', () => ({
  __esModule: true,
  useAppContext: jest.fn(() => ({ appDirectory: '' })),
  useResolvedConfigContext: jest.fn(),
}));

jest.mock('dotenv', () => ({
  __esModule: true,
  config: jest.fn(),
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
    await dev({ tsconfig: 'tsconfig.json' }, 'storybook');
    expect(mockRunSubCmd.mock.calls.length).toBe(1);
    expect(mockRunSubCmd.mock.calls[0][0]).toBe('storybook');
  });

  it('should not call runSubCmd with nothing param', async () => {
    await dev({ tsconfig: 'tsconfig.json' });
    expect(mockRunSubCmd.mock.calls.length).toBe(0);
  });
});
