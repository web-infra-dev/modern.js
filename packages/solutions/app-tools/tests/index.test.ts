import { join } from 'node:path';
import appToolsDefault, {
  type AppUserConfig,
  appTools,
  closeServer,
  mergeConfig,
  resolveModernRsbuildConfig,
} from '../src';
import * as appToolsExports from '../src';
import type { DeployOptions } from '../src';

describe('app-tools export', () => {
  it('default export', () => {
    expect(appToolsDefault).toBeDefined();
  });

  it('named export', () => {
    const deployOptions: DeployOptions = { skipBuild: true };

    expect(appTools).toBeDefined();
    expect(closeServer).toBeDefined();
    expect(deployOptions.skipBuild).toBe(true);
    expect(appToolsExports).not.toHaveProperty('build');
    expect(appToolsExports).not.toHaveProperty('deploy');
  });
});

describe('merge config', () => {
  test('should replace property deeply', () => {
    expect(
      mergeConfig([
        {
          source: { disableDefaultEntries: false },
          output: { polyfill: 'usage' },
        },
        {
          source: { disableDefaultEntries: true },
          output: { polyfill: 'entry' },
        },
      ]),
    ).toEqual({
      source: { disableDefaultEntries: true },
      output: { polyfill: 'entry' },
    });
  });
});

describe('resolveModernRsbuildConfig lazy compilation', () => {
  const defaultLazyCompilation = { imports: true, entries: false };
  const cases = [
    ['CSR', {}, defaultLazyCompilation],
    ['default stream SSR', { server: { ssr: true } }, defaultLazyCompilation],
    [
      'explicit stream SSR',
      { server: { ssr: { mode: 'stream' } } },
      defaultLazyCompilation,
    ],
    [
      'stream-only entries',
      { server: { ssrByEntries: { a: false, b: { mode: 'stream' } } } },
      defaultLazyCompilation,
    ],
    ['string SSR', { server: { ssr: { mode: 'string' } } }, false],
    [
      'a string SSR entry',
      { server: { ssrByEntries: { a: true, b: { mode: 'string' } } } },
      false,
    ],
    ['SSG', { output: { ssg: true } }, false],
    ['an SSG entry', { output: { ssgByEntries: { main: true } } }, false],
    ['explicit false', { dev: { lazyCompilation: false } }, false],
    [
      'explicit options',
      { dev: { lazyCompilation: { imports: false } } },
      { imports: false },
    ],
  ] satisfies [string, AppUserConfig, unknown][];

  it.each(cases)('resolves %s', async (_name, config, expected) => {
    const cwd = join(__dirname, 'fixtures/subcommand');
    const { rsbuildConfig } = await resolveModernRsbuildConfig({
      command: 'dev',
      cwd,
      configPath: join(cwd, 'config.ts'),
      modifyModernConfig: () => ({ ...config, plugins: [appTools()] }),
    });
    expect(rsbuildConfig.dev?.lazyCompilation).toEqual(expected);
  });
});
