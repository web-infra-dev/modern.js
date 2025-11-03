import { join } from 'path';
import { fs } from '@modern-js/utils';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';

const fixtures = __dirname;

test.describe('html configure multi', () => {
  let builder: Awaited<ReturnType<typeof build>>;

  test.beforeAll(async () => {
    builder = await build({
      cwd: join(fixtures, 'mount-id'),
      entry: {
        main: join(join(fixtures, 'mount-id'), 'src/index.ts'),
      },
      runServer: true,
      builderConfig: {
        html: {
          mountId: 'app',
        },
      },
    });
  });

  test.afterAll(() => {
    builder.close();
  });

  test('title default', async ({ page }) => {
    await page.goto(getHrefByEntryName('main', builder.port));

    await expect(page.evaluate(`document.title`)).resolves.toBe('');
  });
});

test.describe('html element set', () => {
  let builder: Awaited<ReturnType<typeof build>>;
  let mainContent: string;
  let fooContent: string;

  test.beforeAll(async () => {
    builder = await build({
      cwd: join(fixtures, 'template'),
      entry: {
        main: join(join(fixtures, 'template'), 'src/index.ts'),
        foo: join(fixtures, 'template/src/index.ts'),
      },
      runServer: true,
      builderConfig: {
        html: {
          meta: {
            description: 'a description of the page',
          },
          inject: 'body',
          favicon: './src/assets/icon.png',
        },
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

  test.afterAll(() => {
    builder.close();
  });

  test('custom inject', async () => {
    expect(
      /<head>[\s\S]*<script[\s\S]*>[\s\S]*<\/head>/.test(mainContent),
    ).toBeFalsy();
    expect(
      /<body>[\s\S]*<script[\s\S]*>[\s\S]*<\/body>/.test(mainContent),
    ).toBeTruthy();
  });

  test('custom meta', async () => {
    const metaContent =
      '<meta name="description" content="a description of the page">';

    // only insert once
    expect(mainContent.indexOf(metaContent)).toBeGreaterThan(0);
    expect(mainContent.indexOf(metaContent)).toBe(
      mainContent.lastIndexOf(metaContent),
    );
  });
});

test('custom title', async ({ page }) => {
  const builder = await build({
    cwd: join(fixtures, 'template'),
    entry: {
      main: join(join(fixtures, 'template'), 'src/index.ts'),
    },
    runServer: true,
    builderConfig: {
      html: {
        title: 'custom title',
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(page.evaluate(`document.title`)).resolves.toBe('custom title');

  builder.close();
});

test('outputStructrue flat', async ({ page }) => {
  const builder = await build({
    cwd: join(fixtures, 'template'),
    entry: {
      main: join(join(fixtures, 'template'), 'src/index.ts'),
    },
    runServer: true,
    builderConfig: {
      html: {
        outputStructure: 'flat',
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const pagePath = join(builder.distPath, 'html/main.html');

  expect(fs.existsSync(pagePath)).toBeTruthy();

  builder.close();
});

test('outputStructrue nested', async ({ page }) => {
  const builder = await build({
    cwd: join(fixtures, 'template'),
    entry: {
      main: join(join(fixtures, 'template'), 'src/index.ts'),
    },
    runServer: true,
    builderConfig: {
      html: {
        outputStructure: 'nested',
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const pagePath = join(builder.distPath, 'html/main/index.html');

  expect(fs.existsSync(pagePath)).toBeTruthy();

  builder.close();
});

test('tools.htmlPlugin', async ({ page }) => {
  const builder = await build({
    cwd: join(fixtures, 'template'),
    entry: {
      main: join(join(fixtures, 'template'), 'src/index.ts'),
    },
    runServer: true,
    builderConfig: {
      tools: {
        htmlPlugin(config, { entryName }) {
          if (entryName === 'main') {
            config.scriptLoading = 'module';
          }
        },
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

  builder.close();
});
