import { join, resolve } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '../scripts/shared';

const fixtures = resolve(__dirname, '../fixtures/html');

test.describe('html configure multi', () => {
  let builder: Awaited<ReturnType<typeof build>>;

  test.beforeAll(async () => {
    const buildOpts = {
      cwd: join(fixtures, 'mount-id'),
      entry: {
        main: join(join(fixtures, 'mount-id'), 'src/index.ts'),
      },
    };

    builder = await build(buildOpts, {
      html: {
        mountId: 'app',
      },
    });
  });

  test('mountId', async ({ page }) => {
    await page.goto(getHrefByEntryName('main', builder.port));

    await expect(
      page.evaluate(`document.getElementById('test').innerHTML`),
    ).resolves.toBe('Hello Builder!');
  });

  test('title default', async ({ page }) => {
    await page.goto(getHrefByEntryName('main', builder.port));

    await expect(page.evaluate(`document.title`)).resolves.toBe('');
  });
});

test('custom title', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'template'),
    entry: {
      main: join(join(fixtures, 'template'), 'src/index.ts'),
    },
  };

  const builder = await build(buildOpts, {
    html: {
      title: 'custom title',
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(page.evaluate(`document.title`)).resolves.toBe('custom title');
});

test('template & templateParameters', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'template'),
    entry: {
      main: join(join(fixtures, 'template'), 'src/index.ts'),
    },
  };

  const builder = await build(buildOpts, {
    html: {
      template: './static/index.html',
      templateParameters: {
        foo: 'bar',
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(page.evaluate(`document.title`)).resolves.toBe(
    'custom template',
  );

  await expect(
    page.evaluate(`document.getElementById('test-template').innerHTML`),
  ).resolves.toBe('xxx');
  await expect(
    page.evaluate(`document.getElementById('test').innerHTML`),
  ).resolves.toBe('Hello Builder!');

  await expect(page.evaluate(`window.foo`)).resolves.toBe('bar');
});

test('templateByEntries & templateParametersByEntries', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'template'),
    entry: {
      main: join(fixtures, 'template/src/index.ts'),
      foo: join(fixtures, 'template/src/index.ts'),
      bar: join(fixtures, 'template/src/index.ts'),
    },
  };

  const builder = await build(buildOpts, {
    html: {
      templateByEntries: {
        foo: './static/foo.html',
        bar: './static/bar.html',
      },
      templateParametersByEntries: {
        foo: {
          type: 'foo',
        },
        bar: {
          type: 'bar',
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('foo', builder.port));

  await expect(
    page.evaluate(`document.getElementById('test-template').innerHTML`),
  ).resolves.toBe('foo');

  await expect(page.evaluate(`window.type`)).resolves.toBe('foo');

  await page.goto(getHrefByEntryName('bar', builder.port));

  await expect(
    page.evaluate(`document.getElementById('test-template').innerHTML`),
  ).resolves.toBe('bar');

  await expect(page.evaluate(`window.type`)).resolves.toBe('bar');
});

test('title & titleByEntries & templateByEntries', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'template'),
    entry: {
      main: join(fixtures, 'template/src/index.ts'),
      foo: join(fixtures, 'template/src/index.ts'),
      bar: join(fixtures, 'template/src/index.ts'),
    },
  };

  // priority: template title > titleByEntries > title
  const builder = await build(buildOpts, {
    html: {
      title: 'custom title',
      titleByEntries: {
        foo: 'Tiktok',
      },
      templateByEntries: {
        bar: './static/index.html',
      },
      templateParameters: {
        foo: 'bar',
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));
  await expect(page.evaluate(`document.title`)).resolves.toBe('custom title');

  await page.goto(getHrefByEntryName('foo', builder.port));
  await expect(page.evaluate(`document.title`)).resolves.toBe('Tiktok');

  await page.goto(getHrefByEntryName('bar', builder.port));
  await expect(page.evaluate(`document.title`)).resolves.toBe(
    'custom template',
  );
});
