import path from 'path';
import { fs } from '@modern-js/utils';
import { expect, test } from '@playwright/test';
import { createBuilder } from '@scripts/shared';

const builderConfig = path.resolve(
  __dirname,
  './dist/.rsbuild/rsbuild.config.mjs',
);
const builderClientConfig = path.resolve(
  __dirname,
  './dist/.rsbuild/rsbuild.config.client.mjs',
);
const builderServerConfig = path.resolve(
  __dirname,
  './dist/.rsbuild/rsbuild.config.server.mjs',
);
const bundlerClientConfig = path.resolve(
  __dirname,
  `./dist/.rsbuild/rspack.config.client.mjs`,
);
const bundlerServerConfig = path.resolve(
  __dirname,
  `./dist/.rsbuild/rspack.config.server.mjs`,
);
const bundlerConfig = path.resolve(
  __dirname,
  `./dist/.rsbuild/rspack.config.web.mjs`,
);

test('should generate config files when writeToDisk is true', async () => {
  const builder = await createBuilder(
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
  const builder = await createBuilder(
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
        client: {},
        server: {
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

  expect(fs.existsSync(builderClientConfig)).toBeTruthy();
  expect(fs.existsSync(builderServerConfig)).toBeTruthy();

  expect(fs.existsSync(bundlerClientConfig)).toBeTruthy();
  expect(fs.existsSync(bundlerServerConfig)).toBeTruthy();

  fs.removeSync(builderClientConfig);
  fs.removeSync(builderServerConfig);
  fs.removeSync(bundlerClientConfig);
  fs.removeSync(bundlerServerConfig);
});

test('should not generate config files when writeToDisk is false', async () => {
  const builder = await createBuilder(
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
