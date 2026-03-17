import { resolveModernRsbuildConfig } from '@modern-js/app-tools';
import { afterEach, describe, expect, rstest, test } from '@rstest/core';
import { withModernConfig } from '../src';

rstest.mock('@modern-js/app-tools', () => ({
  __esModule: true,
  resolveModernRsbuildConfig: rstest.fn(),
}));

describe('withModernConfig', () => {
  const mockResolveModernRsbuildConfig = rstest.mocked(
    resolveModernRsbuildConfig,
  );

  afterEach(() => {
    rstest.resetAllMocks();
  });

  test('should resolve modern rsbuild config with rstest command', async () => {
    mockResolveModernRsbuildConfig.mockResolvedValue({
      rsbuildConfig: {
        root: '/app',
        output: {
          target: 'node',
        },
      },
    });

    const extend = withModernConfig({
      cwd: '/app',
      configPath: 'custom.modern.config.ts',
    });

    const config = await extend({});

    expect(mockResolveModernRsbuildConfig).toBeCalledTimes(1);
    expect(mockResolveModernRsbuildConfig).toBeCalledWith({
      cwd: '/app',
      configPath: 'custom.modern.config.ts',
      command: 'rstest',
      modifyModernConfig: expect.any(Function),
    });
    expect(config.testEnvironment).toBe('node');
    expect(config.root).toBe('/app');
  });
});
