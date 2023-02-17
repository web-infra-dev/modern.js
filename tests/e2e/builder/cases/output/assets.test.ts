import { join } from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';
import { allProviderTest } from '@scripts/helper';

const fixtures = __dirname;

const cases = [
  {
    name: 'assets(default)',
    cwd: join(fixtures, 'assets'),
    expected: 'inline',
  },
  {
    name: 'assets(maxSize 0)',
    cwd: join(fixtures, 'assets'),
    config: {
      output: {
        dataUriLimit: {
          image: 0,
        },
      },
    },
    expected: 'url',
  },
  {
    name: 'assets(maxSize Infinity)',
    cwd: join(fixtures, 'assets'),
    config: {
      output: {
        dataUriLimit: {
          // rspack not support Infinity
          image: 5 * 1024,
        },
      },
    },
    expected: 'inline',
  },
  {
    name: 'assets-url',
    cwd: join(fixtures, 'assets-url'),
    expected: 'url',
  },
  {
    name: 'assets-no-inline',
    cwd: join(fixtures, 'assets-no-inline'),
    expected: 'url',
  },
  {
    name: 'assets__inline',
    cwd: join(fixtures, 'assets__inline'),
    expected: 'inline',
  },
  {
    name: 'assets-inline',
    cwd: join(fixtures, 'assets-inline'),
    expected: 'inline',
  },
];

cases.forEach(_case => {
  allProviderTest(_case.name, async ({ page }) => {
    const buildOpts = {
      cwd: _case.cwd,
      entry: {
        main: join(_case.cwd, 'src/index.js'),
      },
    };

    const builder = await build(buildOpts, _case.config || {});

    await page.goto(getHrefByEntryName('main', builder.port));

    if (_case.expected === 'url') {
      await expect(
        page.evaluate(
          `document.getElementById('test-img').src.includes('static/image/icon')`,
        ),
      ).resolves.toBeTruthy();
    } else {
      await expect(
        page.evaluate(
          `document.getElementById('test-img').src.startsWith('data:image/png')`,
        ),
      ).resolves.toBeTruthy();
    }

    builder.close();
  });
});
