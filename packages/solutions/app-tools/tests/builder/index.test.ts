import path from 'path';
import { initSnapshotSerializer } from '@scripts/jest-config/utils';
import { createBuilderProviderConfig } from '../../src/builder/generator/createBuilderProviderConfig';
import { getBuilderEnvironments } from '../../src/builder/generator/getBuilderEnvironments';

initSnapshotSerializer({ cwd: path.resolve(__dirname, '../..') });

describe('create builder Options', () => {
  it('test create builder environments config', () => {
    const appContext = {
      entrypoints: [
        {
          entryName: 'main',
          entry: './src/index.ts',
        },
        {
          entryName: 'main',
          entry: './src/main.ts',
        },
        {
          entryName: 'next',
          entry: './src/next.ts',
        },
        {
          entryName: 'error',
          entry: '',
        },
      ],
      checkedEntries: ['main', 'next'],
      configFile: 'modern.config.ts',
      appDirectory: 'appDirectory',
    };

    expect(
      getBuilderEnvironments({} as any, appContext as any, {} as any),
    ).toMatchSnapshot();

    expect(
      getBuilderEnvironments(
        {
          server: {
            ssr: true,
          },
        } as any,
        appContext as any,
        {} as any,
      ),
    ).toMatchSnapshot();

    expect(
      getBuilderEnvironments(
        {
          output: {
            ssg: true,
          },
          deploy: {
            worker: {
              ssr: true,
            },
          },
        } as any,
        appContext as any,
        {
          output: {
            copy: [
              {
                from: '**/*',
                to: 'upload',
              },
            ],
          },
        } as any,
      ),
    ).toMatchSnapshot();
  });
});

describe('create builder provider config', () => {
  it('should add default config', () => {
    const config = {
      output: {
        assetPrefix: '/x',
        copy: [{ from: 'xxx', to: 'yyy' }],
      },
      source: {},
      performance: {},
      dev: {},
      html: {},
    };
    const appContext = {
      appDirectory: path.join(__dirname, '../fixtures'),
      configDir: './icons',
    };

    const builderConfig = createBuilderProviderConfig(
      config as any,
      appContext as any,
    );

    expect(builderConfig).toMatchSnapshot();
  });

  it('should passing dev.startUrl config', () => {
    const config = {
      source: {},
      output: {},
      dev: {
        startUrl: '/xxx',
      },
    };
    const appContext = {
      appDirectory: `/fixtrues`,
      configDir: './icons',
    };

    const builderConfig = createBuilderProviderConfig(
      config as any,
      appContext as any,
    );

    expect(builderConfig.dev?.startUrl).toEqual('/xxx');
  });
});
