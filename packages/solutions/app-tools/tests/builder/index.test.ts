import path from 'path';
import type { RsbuildTarget } from '@rsbuild/core';
import { initSnapshotSerializer } from '@scripts/jest-config/utils';
import { createBuilderProviderConfig } from '../../src/builder/generator/createBuilderProviderConfig';
import { createBuilderOptions } from '../../src/builder/generator/createBuilderOptions';

initSnapshotSerializer({ cwd: path.resolve(__dirname, '../..') });

describe('create builder Options', () => {
  it('test create builder Options', () => {
    const targets: RsbuildTarget[] = ['node', 'web'];
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
    const options = createBuilderOptions(targets, appContext as any);
    expect(options.cwd).toBe('appDirectory');
    expect(options.target).toEqual(targets);
    expect(options.frameworkConfigPath).toBe('modern.config.ts');
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
