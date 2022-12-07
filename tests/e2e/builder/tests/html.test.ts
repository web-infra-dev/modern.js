import { join, resolve } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { fs } from '@modern-js/utils';
import { build, getHrefByEntryName } from '../scripts/shared';
import { allProviderTest } from './helper';

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

  allProviderTest('mountId', async ({ page }) => {
    await page.goto(getHrefByEntryName('main', builder.port));

    await expect(
      page.evaluate(`document.getElementById('test').innerHTML`),
    ).resolves.toBe('Hello Builder!');
  });

  allProviderTest('title default', async ({ page }) => {
    await page.goto(getHrefByEntryName('main', builder.port));

    await expect(page.evaluate(`document.title`)).resolves.toBe('');
  });

  allProviderTest('inject default (head)', async () => {
    const pagePath = join(builder.distPath, 'html/main/index.html');
    const content = await fs.readFile(pagePath, 'utf-8');

    expect(
      /<head>[\s\S]*<script[\s\S]*>[\s\S]*<\/head>/.test(content),
    ).toBeTruthy();
    expect(
      /<body>[\s\S]*<script[\s\S]*>[\s\S]*<\/body>/.test(content),
    ).toBeFalsy();
  });
});

test.describe('html element set', () => {
  let builder: Awaited<ReturnType<typeof build>>;
  let mainContent: string;
  let fooContent: string;

  test.beforeAll(async () => {
    const buildOpts = {
      cwd: join(fixtures, 'template'),
      entry: {
        main: join(join(fixtures, 'template'), 'src/index.ts'),
        foo: join(fixtures, 'template/src/index.ts'),
      },
    };

    builder = await build(buildOpts, {
      html: {
        meta: {
          description: 'a description of the page',
        },
        inject: 'body',
        crossorigin: 'anonymous',
        appIcon: './src/assets/icon.png',
        favicon: './src/assets/icon.png',
      },
    });

    mainContent = await fs.readFile(
      join(builder.distPath, 'html/main/index.html'),
      'utf-8',
    );
    fooContent = await fs.readFile(
      join(builder.distPath, 'html/foo/index.html'),
      'utf-8',
    );
  });

  allProviderTest('appicon', async () => {
    const [, iconRelativePath] =
      /<link.*rel="apple-touch-icon".*href="(.*?)">/.exec(mainContent) || [];

    expect(iconRelativePath).toBeDefined();

    const iconPath = join(builder.distPath, iconRelativePath);
    expect(fs.existsSync(iconPath)).toBeTruthy();

    // should work on all page
    expect(
      /<link.*rel="apple-touch-icon".*href="(.*?)">/.test(fooContent),
    ).toBeTruthy();
  });

  allProviderTest('favicon', async () => {
    const [, iconRelativePath] =
      /<link.*rel="icon".*href="(.*?)">/.exec(mainContent) || [];

    expect(iconRelativePath).toBeDefined();

    const iconPath = join(builder.distPath, iconRelativePath);
    expect(fs.existsSync(iconPath)).toBeTruthy();

    // should work on all page
    expect(/<link.*rel="icon".*href="(.*?)">/.test(fooContent)).toBeTruthy();
  });

  allProviderTest('custom inject', async () => {
    expect(
      /<head>[\s\S]*<script[\s\S]*>[\s\S]*<\/head>/.test(mainContent),
    ).toBeFalsy();
    expect(
      /<body>[\s\S]*<script[\s\S]*>[\s\S]*<\/body>/.test(mainContent),
    ).toBeTruthy();
  });

  allProviderTest('custom meta', async () => {
    expect(
      /<meta name="description" content="a description of the page">/.test(
        mainContent,
      ),
    ).toBeTruthy();
  });

  allProviderTest('custom crossorigin', async () => {
    const allScripts = /(<script [\s\S]*?>)/g.exec(mainContent);

    expect(
      allScripts?.every(data => data.includes('crossorigin="anonymous"')),
    ).toBeTruthy();
  });
});

allProviderTest('custom title', async ({ page }) => {
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

allProviderTest('template & templateParameters', async ({ page }) => {
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

allProviderTest(
  'templateByEntries & templateParametersByEntries',
  async ({ page }) => {
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
  },
);

allProviderTest(
  'title & titleByEntries & templateByEntries',
  async ({ page }) => {
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
  },
);

allProviderTest('disableHtmlFolder', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'template'),
    entry: {
      main: join(join(fixtures, 'template'), 'src/index.ts'),
    },
  };

  const builder = await build(buildOpts, {
    html: {
      disableHtmlFolder: true,
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const pagePath = join(builder.distPath, 'html/main.html');

  expect(fs.existsSync(pagePath)).toBeTruthy();
});

allProviderTest('tools.htmlPlugin', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'template'),
    entry: {
      main: join(join(fixtures, 'template'), 'src/index.ts'),
    },
  };

  const builder = await build(buildOpts, {
    tools: {
      htmlPlugin(config, { entryName }) {
        if (entryName === 'main') {
          config.scriptLoading = 'module';
        }
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const pagePath = join(builder.distPath, 'html/main/index.html');
  const content = await fs.readFile(pagePath, 'utf-8');

  const allScripts = /(<script [\s\S]*?>)/g.exec(content);

  expect(
    allScripts?.every(data => data.includes('type="module"')),
  ).toBeTruthy();
});
