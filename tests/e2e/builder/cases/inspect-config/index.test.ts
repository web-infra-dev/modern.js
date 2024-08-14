import path from 'path';
import { fs } from '@modern-js/utils';
import { expect, test } from '@modern-js/e2e/playwright';
import { createUniBuilder } from '@scripts/shared';

const builderConfig = path.resolve(
  __dirname,
  './dist/.rsbuild/rsbuild.config.mjs',
);
const builderWebConfig = path.resolve(
  __dirname,
  './dist/.rsbuild/rsbuild.config.web.mjs',
);
const builderNodeConfig = path.resolve(
  __dirname,
  './dist/.rsbuild/rsbuild.config.node.mjs',
);
const bundlerConfig = path.resolve(
  __dirname,
  `./dist/.rsbuild/${process.env.PROVIDE_TYPE || 'webpack'}.config.web.mjs`,
);
const bundlerNodeConfig = path.resolve(
  __dirname,
  `./dist/.rsbuild/${process.env.PROVIDE_TYPE || 'webpack'}.config.node.mjs`,
);

test('should generate config files when writeToDisk is true', async () => {
  const builder = await createUniBuilder(
    {
      cwd: __dirname,
    },
    {
      source: {
        entry: {
          index: path.resolve(__dirname, './src/index.js'),
        },
      },
    },
  );
  await builder.inspectConfig({
    writeToDisk: true,
  });

  expect(fs.existsSync(bundlerConfig)).toBeTruthy();
  expect(fs.existsSync(builderConfig)).toBeTruthy();

  fs.removeSync(builderConfig);
  fs.removeSync(bundlerConfig);
});

test('should generate bundler config for node when target contains node', async () => {
  const builder = await createUniBuilder(
    {
      cwd: __dirname,
    },
    {
      source: {
        entry: {
          index: path.resolve(__dirname, './src/index.js'),
        },
      },
      environments: {
        web: {},
        node: {
          output: {
            target: 'node',
          },
        },
      },
    },
  );
  await builder.inspectConfig({
    writeToDisk: true,
  });

  expect(fs.existsSync(builderWebConfig)).toBeTruthy();
  expect(fs.existsSync(builderNodeConfig)).toBeTruthy();

  expect(fs.existsSync(bundlerConfig)).toBeTruthy();
  expect(fs.existsSync(bundlerNodeConfig)).toBeTruthy();

  fs.removeSync(builderWebConfig);
  fs.removeSync(builderNodeConfig);
  fs.removeSync(bundlerConfig);
  fs.removeSync(bundlerNodeConfig);
});

test('should not generate config files when writeToDisk is false', async () => {
  const builder = await createUniBuilder(
    {
      cwd: __dirname,
    },
    {
      source: {
        entry: {
          index: path.resolve(__dirname, './src/index.js'),
        },
      },
    },
  );
  await builder.inspectConfig({
    writeToDisk: false,
  });

  expect(fs.existsSync(builderConfig)).toBeFalsy();
  expect(fs.existsSync(bundlerConfig)).toBeFalsy();
});
