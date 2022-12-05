import path from 'path';
import { fs } from '@modern-js/utils';
import { expect, test } from '@modern-js/e2e/playwright';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';

test('should save the buildDependencies to cache directory', async () => {
  const builder = await createStubBuilder({
    webpack: true,
    entry: { index: path.resolve('./src/index.js') },
    configPath: __dirname,
  });
  await builder.build();

  const configFile = path.resolve(
    './node_modules/.cache/webpack/buildDependencies.json',
  );
  const buildDependencies = await fs.readJSON(configFile);
  expect(Object.keys(buildDependencies)).toEqual(['packageJson', 'config']);
});
