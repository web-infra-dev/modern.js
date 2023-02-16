import { join, resolve } from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '../scripts/shared';
import { allProviderTest } from '../scripts/helper';

const fixtures = resolve(__dirname, '../fixtures/output');

allProviderTest('svg (default)', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'svg'),
    entry: {
      main: join(fixtures, 'svg', 'src/index.js'),
    },
  };

  const builder = await build(buildOpts, {});

  await page.goto(getHrefByEntryName('main', builder.port));

  // test svgr（namedExport）
  await expect(
    page.evaluate(`document.getElementById('test-svg').tagName === 'svg'`),
  ).resolves.toBeTruthy();

  // test svg asset
  await expect(
    page.evaluate(
      `document.getElementById('test-img').src.startsWith('data:image/svg')`,
    ),
  ).resolves.toBeTruthy();

  // test svg asset in css
  await expect(
    page.evaluate(
      `getComputedStyle(document.getElementById('test-css')).backgroundImage.includes('url("data:image/svg')`,
    ),
  ).resolves.toBeTruthy();

  builder.close();
});

allProviderTest('svg (defaultExport component)', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'svg-default-export-component'),
    entry: {
      main: join(fixtures, 'svg-default-export-component', 'src/index.js'),
    },
  };

  const builder = await build(buildOpts, {
    output: {
      svgDefaultExport: 'component',
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(
    page.evaluate(`document.getElementById('test-svg').tagName === 'svg'`),
  ).resolves.toBeTruthy();

  builder.close();
});

allProviderTest('svg (url)', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'svg-url'),
    entry: {
      main: join(fixtures, 'svg-url', 'src/index.js'),
    },
  };

  const builder = await build(buildOpts, {});

  await page.goto(getHrefByEntryName('main', builder.port));

  // test svg asset
  await expect(
    page.evaluate(
      `document.getElementById('test-img').src.includes('static/svg/app')`,
    ),
  ).resolves.toBeTruthy();

  // test svg asset in css
  await expect(
    page.evaluate(
      `getComputedStyle(document.getElementById('test-css')).backgroundImage.includes('static/svg/app')`,
    ),
  ).resolves.toBeTruthy();

  builder.close();
});

// It's an old bug when use svgr in css and external react.
allProviderTest('svg (external react)', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'svg-external-react'),
    entry: {
      main: join(fixtures, 'svg-external-react', 'src/index.js'),
    },
  };

  const builder = await build(buildOpts, {
    output: {
      externals: {
        react: 'React',
        'react-dom': 'ReactDOM',
      },
    },
    html: {
      template: './static/index.html',
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  // test svgr（namedExport）
  await expect(
    page.evaluate(`document.getElementById('test-svg').tagName === 'svg'`),
  ).resolves.toBeTruthy();

  // test svg asset
  await expect(
    page.evaluate(
      `document.getElementById('test-img').src.startsWith('data:image/svg')`,
    ),
  ).resolves.toBeTruthy();

  // test svg asset in css
  await expect(
    page.evaluate(
      `getComputedStyle(document.getElementById('test-css')).backgroundImage.includes('url("data:image/svg')`,
    ),
  ).resolves.toBeTruthy();

  builder.close();
});
