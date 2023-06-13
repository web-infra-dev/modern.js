import path from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { webpackOnlyTest } from '@scripts/helper';
import { build } from '@scripts/shared';
import { fs } from '@modern-js/utils';

webpackOnlyTest(
  'should save the buildDependencies to cache directory',
  async () => {
    const configFile = path.resolve(
      __dirname,
      './node_modules/.cache/webpack/buildDependencies.json',
    );

    fs.removeSync(configFile);

    await build({
      cwd: __dirname,
      entry: { index: path.resolve(__dirname, './src/index.js') },
      configPath: __dirname,
      builderConfig: {
        performance: {
          buildCache: {},
        },
      },
    });

    const buildDependencies = await fs.readJSON(configFile);
    expect(Object.keys(buildDependencies)).toEqual([
      'packageJson',
      'config',
      'tsconfig',
    ]);
  },
);
