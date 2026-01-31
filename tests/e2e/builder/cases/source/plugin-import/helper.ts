import path from 'path';
import { expect, test } from '@playwright/test';
import type { RsbuildConfig, SourceConfig } from '@rsbuild/core';
import { build } from '@scripts/shared';
import { copySync, ensureDirSync } from 'fs-extra';

export const cases: Parameters<typeof shareTest>[] = [
  [
    `camelCase test`,
    './src/camel.js',
    [
      {
        libraryName: 'foo',
        libraryDirectory: 'lib',
        camelToDashComponentName: false,
      },
    ],
  ],
  [
    `kebab-case test`,
    './src/kebab.js',
    [
      {
        libraryName: 'foo',
        libraryDirectory: 'lib',
        camelToDashComponentName: true,
      },
    ],
  ],
  [
    'transform to named import',
    './src/named.js',
    [
      {
        libraryName: 'foo',
        libraryDirectory: 'lib',
        camelToDashComponentName: true,
        transformToDefaultImport: false,
      },
    ],
  ],
];

export function findEntry(
  files: Record<string, string>,
  name = 'index',
): string {
  for (const key of Reflect.ownKeys(files) as string[]) {
    if (key.includes(`dist/static/js/${name}`) && key.endsWith('.js')) {
      return key;
    }
  }

  throw new Error('unreacheable');
}

export function copyPkgToNodeModules() {
  const nodeModules = path.resolve(__dirname, 'node_modules');

  ensureDirSync(nodeModules);
  copySync(path.resolve(__dirname, 'foo'), path.resolve(nodeModules, 'foo'));
}

export function shareTest(
  msg: string,
  entry: string,
  transformImport: SourceConfig['transformImport'],
  otherConfigs: {
    plugins?: any[];
  } = {},
) {
  const setupConfig = {
    cwd: __dirname,
    entry: {
      index: entry,
    },
  };
  const config: RsbuildConfig = {
    source: {
      transformImport,
    },
    splitChunks: false,
  };

  test(msg, async () => {
    const builder = await build({
      ...setupConfig,
      ...otherConfigs,
      builderConfig: { ...config },
    });
    const files = await builder.unwrapOutputJSON(false);
    expect(files[findEntry(files)]).toContain('transformImport test succeed');
  });
}
