import { join } from 'node:path';
import { createBuilderProviderConfig } from '../../src/builder/generator/createBuilderProviderConfig';
import { getBuilderEnvironments } from '../../src/builder/generator/getBuilderEnvironments';

describe('getBuilderEnvironments', () => {
  const appContext = {
    entrypoints: [
      { entryName: 'main', entry: './index.jsx' },
      { entryName: 'main', entry: './bootstrap.jsx' },
      { entryName: 'ignored', entry: './other.ts' },
    ],
    checkedEntries: ['main'],
  };

  it('groups enabled entries and selects their server counterparts for SSR', () => {
    const { environments } = getBuilderEnvironments(
      { server: { ssr: true } } as any,
      appContext as any,
      {} as any,
    );

    expect(environments.client.source?.entry).toEqual({
      main: ['./index.jsx', './bootstrap.jsx'],
    });
    expect(environments.server.source?.entry).toEqual({
      main: ['./index.server.jsx', './bootstrap.server.jsx'],
    });
    expect(environments.server.output?.target).toBe('node');
  });

  it('copies assets only from the client environment when building a worker', () => {
    const copy = [{ from: '**/*', to: 'upload' }];
    const { environments, builderConfig } = getBuilderEnvironments(
      { output: { ssg: true }, deploy: { worker: { ssr: true } } } as any,
      appContext as any,
      { output: { copy } } as any,
    );

    expect(environments.client.output?.copy).toEqual(copy);
    expect(environments.workerSSR.output?.target).toBe('web-worker');
    expect(environments.workerSSR.output?.copy).toBeUndefined();
    expect(builderConfig.output?.copy).toBeUndefined();
  });
});

describe('create builder provider config', () => {
  it('preserves user copy patterns alongside the framework upload directory', () => {
    const pattern = { from: 'extra', to: 'assets' };
    const appDirectory = join(__dirname, '../fixtures');
    const config = createBuilderProviderConfig(
      { output: { copy: [pattern] } } as any,
      { appDirectory } as any,
    );
    expect(config.output.copy).toEqual([
      pattern,
      expect.objectContaining({
        context: join(appDirectory, 'config', 'upload').replaceAll('\\', '/'),
        to: 'upload',
      }),
    ]);
  });

  it('should not pass dev.mockDir to Builder', () => {
    const config = {
      source: {},
      output: {},
      dev: {
        mockDir: './mocks',
      },
    };
    const appContext = {
      appDirectory: `/fixtures`,
      configDir: './icons',
    };

    const builderConfig = createBuilderProviderConfig(
      config as any,
      appContext as any,
    );

    expect(builderConfig.dev?.mockDir).toBeUndefined();
    expect(config.dev.mockDir).toBe('./mocks');
  });

  it('should not mutate source.preEntry when removing it from builder config', () => {
    const config = {
      source: {
        enableAsyncEntry: true,
        enableAsyncPreEntry: true,
        preEntry: ['./src/pre.ts'],
      },
      output: {},
      dev: {},
      html: {},
    };
    const appContext = {
      appDirectory: `/fixtrues`,
      configDir: './icons',
    };

    const builderConfig = createBuilderProviderConfig(
      config as any,
      appContext as any,
    );

    expect(builderConfig.source?.preEntry).toBeUndefined();
    expect(config.source.preEntry).toEqual(['./src/pre.ts']);
  });
});
