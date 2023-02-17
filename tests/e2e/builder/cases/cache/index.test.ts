import path from 'path';
import { fs } from '@modern-js/utils';
import { expect } from '@modern-js/e2e/playwright';
import { webpackOnlyTest } from '@scripts/helper';
import { build } from '@scripts/shared';

webpackOnlyTest(
  'should save the buildDependencies to cache directory',
  async () => {
    await build({
      cwd: __dirname,
      entry: { index: path.resolve(__dirname, './src/index.js') },
      configPath: __dirname,
    });

    const configFile = path.resolve(
      './node_modules/.cache/webpack/buildDependencies.json',
    );
    const buildDependencies = await fs.readJSON(configFile);
    expect(Object.keys(buildDependencies)).toEqual(['packageJson', 'tsconfig']);
  },
);
