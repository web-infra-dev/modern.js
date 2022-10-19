import path from 'path';
import { fs } from '@modern-js/utils';
import { expect, test } from '@modern-js/e2e/playwright';
import { createBuilder } from '@modern-js/builder';
import { builderWebpackProvider } from '@modern-js/builder-webpack-provider';

const builderConfig = path.resolve(__dirname, './dist/builder.config.js');
const webpackConfig = path.resolve(__dirname, './dist/webpack.config.web.js');
const webpackNodeConfig = path.resolve(
  __dirname,
  './dist/webpack.config.node.js',
);

test('should generate config files when writeToDisk is true', async () => {
  const builder = await createBuilder(
    builderWebpackProvider({
      builderConfig: {},
    }),
    {
      entry: {
        index: path.resolve('./src/index.js'),
      },
    },
  );
  await builder.inspectConfig({
    writeToDisk: true,
  });

  expect(fs.existsSync(webpackConfig)).toBeTruthy();
  expect(fs.existsSync(builderConfig)).toBeTruthy();

  fs.removeSync(builderConfig);
  fs.removeSync(webpackConfig);
});

test('should generate webpack config for node when target contains node', async () => {
  const builder = await createBuilder(
    builderWebpackProvider({
      builderConfig: {},
    }),
    {
      target: ['web', 'node'],
      entry: {
        index: path.resolve('./src/index.js'),
      },
    },
  );
  await builder.inspectConfig({
    writeToDisk: true,
  });

  expect(fs.existsSync(builderConfig)).toBeTruthy();
  expect(fs.existsSync(webpackConfig)).toBeTruthy();
  expect(fs.existsSync(webpackNodeConfig)).toBeTruthy();

  fs.removeSync(builderConfig);
  fs.removeSync(webpackConfig);
  fs.removeSync(webpackNodeConfig);
});

test('should not generate config files when writeToDisk is false', async () => {
  const builder = await createBuilder(
    builderWebpackProvider({
      builderConfig: {},
    }),
    {
      entry: {
        index: path.resolve('./src/index.js'),
      },
    },
  );
  await builder.inspectConfig({
    writeToDisk: false,
  });

  expect(fs.existsSync(builderConfig)).toBeFalsy();
  expect(fs.existsSync(webpackConfig)).toBeFalsy();
});
