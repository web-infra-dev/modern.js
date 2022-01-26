import { program } from 'commander';
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
  it('should be storybook with "dev storybook"', () => {
    devCli(program);
    program.parse(['', '', 'dev', 'storybook']);
    expect(mockCommandDev.mock.calls[0][1]).toBe('storybook');
  });

  it('should be undefined with "dev"', () => {
    devCli(program);
    program.parse(['', '', 'dev']);
    expect(mockCommandDev.mock.calls[0][1]).toBe(undefined);
  });
});
