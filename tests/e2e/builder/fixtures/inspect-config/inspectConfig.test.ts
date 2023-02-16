import path from 'path';
import { fs } from '@modern-js/utils';
import { expect, test } from '@modern-js/e2e/playwright';
import { webpackOnlyTest } from '@scripts/helper';
import { build } from '@scripts/shared';

const builderConfig = path.resolve(__dirname, './dist/builder.config.js');
const bundlerConfig = path.resolve(
  __dirname,
  `./dist/${process.env.PROVIDE_TYPE || 'webpack'}.config.web.js`,
);
const bundlerNodeConfig = path.resolve(
  __dirname,
  `./dist/${process.env.PROVIDE_TYPE || 'webpack'}.config.node.js`,
);

webpackOnlyTest(
  'should generate config files when writeToDisk is true',
  async () => {
    const builder = await build({
      cwd: __dirname,
      entry: {
        index: path.resolve(__dirname, './src/index.js'),
      },
      builderConfig: {},
    });
    await builder.instance.inspectConfig({
      writeToDisk: true,
    });

    expect(fs.existsSync(bundlerConfig)).toBeTruthy();
    expect(fs.existsSync(builderConfig)).toBeTruthy();

    fs.removeSync(builderConfig);
    fs.removeSync(bundlerConfig);
  },
);

test('should generate bundler config for node when target contains node', async () => {
  const builder = await build({
    cwd: __dirname,
    target: ['web', 'node'],
    entry: {
      index: path.resolve(__dirname, './src/index.js'),
    },
  });
  await builder.instance.inspectConfig({
    writeToDisk: true,
  });

  expect(fs.existsSync(builderConfig)).toBeTruthy();
  expect(fs.existsSync(bundlerConfig)).toBeTruthy();
  expect(fs.existsSync(bundlerNodeConfig)).toBeTruthy();

  fs.removeSync(builderConfig);
  fs.removeSync(bundlerConfig);
  fs.removeSync(bundlerNodeConfig);
});

test('should not generate config files when writeToDisk is false', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.js'),
    },
  });
  await builder.instance.inspectConfig({
    writeToDisk: false,
  });

  expect(fs.existsSync(builderConfig)).toBeFalsy();
  expect(fs.existsSync(bundlerConfig)).toBeFalsy();
});
