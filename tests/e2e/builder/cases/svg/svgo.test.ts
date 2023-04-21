import { join } from 'path';
import { readFileSync } from 'fs';
import { expect } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';
import { allProviderTest } from '@scripts/helper';

allProviderTest('should preserve viewBox after svgo minification', async () => {
  const fixture = join(__dirname, 'svgo-minify-view-box');
  const buildOpts = {
    cwd: fixture,
    entry: {
      main: join(fixture, 'src/index.jsx'),
    },
  };

  const builder = await build(buildOpts);

  const files = await builder.unwrapOutputJSON();
  const mainJs = Object.keys(files).find(
    file => file.includes('/main.') && file.endsWith('.js'),
  );
  const content = readFileSync(mainJs!, 'utf-8');

  expect(
    content.includes('width:120,height:120,viewBox:"0 0 120 120"'),
  ).toBeTruthy();
});

allProviderTest('should add id prefix after svgo minification', async () => {
  const fixture = join(__dirname, 'svgo-minify-id-prefix');
  const buildOpts = {
    cwd: fixture,
    entry: {
      main: join(fixture, 'src/index.jsx'),
    },
  };

  const builder = await build(buildOpts);

  const files = await builder.unwrapOutputJSON();
  const mainJs = Object.keys(files).find(
    file => file.includes('/main.') && file.endsWith('.js'),
  );
  const content = readFileSync(mainJs!, 'utf-8');

  expect(
    content.includes('"linearGradient",{id:"idPrefix_svg__a"}'),
  ).toBeTruthy();
});
