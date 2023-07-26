import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';
import type { SharedBuilderConfig } from '@modern-js/builder-shared';

function getCommonBuildConfig(cwd: string): SharedBuilderConfig {
  return {
    source: {
      exclude: [path.resolve(cwd, './src/test.js')],
    },
    tools: {
      // @ts-expect-error
      rspack: config => {
        config.target = ['web'];
        config.builtins.presetEnv = undefined;
      },
    },
  };
}

test('should throw error when exist syntax errors', async () => {
  const cwd = path.join(__dirname, 'fixtures/basic');
  await expect(
    build({
      cwd,
      entry: { index: path.resolve(cwd, './src/index.js') },
      builderConfig: {
        ...getCommonBuildConfig(cwd),
        security: {
          checkSyntax: true,
        },
      },
    }),
  ).rejects.toThrowError('[Syntax Checker]');
});

test('should not throw error when the file is excluded', async () => {
  const cwd = path.join(__dirname, 'fixtures/basic');
  await expect(
    build({
      cwd,
      entry: { index: path.resolve(cwd, './src/index.js') },
      builderConfig: {
        ...getCommonBuildConfig(cwd),
        security: {
          checkSyntax: {
            exclude: /src\/test/,
          },
        },
      },
    }),
  ).resolves.toBeTruthy();
});

test('should not throw error when the targets are support es6', async () => {
  const cwd = path.join(__dirname, 'fixtures/basic');

  await expect(
    build({
      cwd,
      entry: { index: path.resolve(cwd, './src/index.js') },
      builderConfig: {
        ...getCommonBuildConfig(cwd),
        security: {
          checkSyntax: {
            targets: ['chrome >= 60', 'edge >= 15'],
          },
        },
      },
    }),
  ).resolves.toBeTruthy();
});

test('should throw error when using optional chaining and target is es6 browsers', async () => {
  const cwd = path.join(__dirname, 'fixtures/esnext');

  await expect(
    build({
      cwd,
      entry: { index: path.resolve(cwd, './src/index.js') },
      builderConfig: {
        ...getCommonBuildConfig(cwd),
        security: {
          checkSyntax: {
            targets: ['chrome >= 53'],
          },
        },
      },
    }),
  ).rejects.toThrowError('[Syntax Checker]');
});

test('should not throw error when using optional chaining and ecmaVersion is 2020', async () => {
  const cwd = path.join(__dirname, 'fixtures/esnext');

  await expect(
    build({
      cwd,
      entry: { index: path.resolve(cwd, './src/index.js') },
      builderConfig: {
        ...getCommonBuildConfig(cwd),
        security: {
          checkSyntax: {
            ecmaVersion: 2020,
          },
        },
      },
    }),
  ).resolves.toBeTruthy();
});
