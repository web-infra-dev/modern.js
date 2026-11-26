import { join } from 'node:path';
import { createConfigOptions } from '@modern-js/plugin/cli';
import { type AppTools, type AppUserConfig, appTools } from '../../src';
import { createBuilderGenerator } from '../../src/builder';

const cwd = join(__dirname, '../fixtures/subcommand');

async function createAppBuilder(config: AppUserConfig) {
  const { config: normalizedConfig, getAppContext } =
    await createConfigOptions<AppTools>({
      command: 'dev',
      cwd,
      configFile: join(cwd, 'config.ts'),
      config: { ...config, plugins: [appTools()] },
    });
  const createBuilder = await createBuilderGenerator();
  const builder = await createBuilder({
    normalizedConfig,
    appContext: {
      ...getAppContext(),
      entrypoints: [
        { entryName: 'main', entry: './index.jsx', isMainEntry: true },
        { entryName: 'main', entry: './bootstrap.jsx', isMainEntry: true },
        { entryName: 'ignored', entry: './other.ts', isMainEntry: false },
      ],
      checkedEntries: ['main'],
    },
  });
  return {
    rsbuildConfig: builder.getRsbuildConfig('original'),
    normalizedConfig,
  };
}

describe('createBuilderGenerator', () => {
  it('groups the selected entries and their server counterparts for SSR', async () => {
    const { rsbuildConfig } = await createAppBuilder({ server: { ssr: true } });
    const { client, server } = rsbuildConfig.environments!;
    expect(client.source?.entry).toEqual({
      main: ['./index.jsx', './bootstrap.jsx'],
    });
    expect(server.source?.entry).toEqual({
      main: ['./index.server.jsx', './bootstrap.server.jsx'],
    });
    expect(server.output?.target).toBe('node');
  });

  it('copies user assets and the framework upload directory only on the client', async () => {
    const pattern = { from: 'extra', to: 'assets' };
    const { rsbuildConfig } = await createAppBuilder({
      deploy: { worker: { ssr: true } },
      output: { ssg: true, copy: [pattern] },
    });
    const { client, workerSSR } = rsbuildConfig.environments!;
    expect(client.output?.copy).toEqual([
      pattern,
      expect.objectContaining({
        context: join(cwd, 'config/upload').replaceAll('\\', '/'),
        to: 'upload',
      }),
    ]);
    expect(workerSSR.output?.target).toBe('web-worker');
    expect(workerSSR.output?.copy).toBeUndefined();
    expect(rsbuildConfig.output?.copy).toBeUndefined();
  });

  it('keeps mockDir and asynchronous preEntry in the Modern config only', async () => {
    const { rsbuildConfig, normalizedConfig } = await createAppBuilder({
      dev: { mockDir: './mocks' },
      source: {
        enableAsyncEntry: true,
        enableAsyncPreEntry: true,
        preEntry: ['./src/pre.ts'],
      },
    });
    expect(rsbuildConfig.dev).not.toHaveProperty('mockDir');
    expect(normalizedConfig.dev.mockDir).toBe('./mocks');
    expect(rsbuildConfig.source?.preEntry).toBeUndefined();
    expect(normalizedConfig.source.preEntry).toEqual(['./src/pre.ts']);
  });

  it('disables lazy compilation by default for RSC', async () => {
    const { rsbuildConfig } = await createAppBuilder({ server: { rsc: true } });
    expect(rsbuildConfig.dev?.lazyCompilation).toBe(false);
  });
});
