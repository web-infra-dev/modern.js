import { join } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';
import { webpackOnlyTest } from '@scripts/helper';

const fixtures = __dirname;

test('should generate prefetch link when prefetch is defined', async () => {
  const builder = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/page1/index.ts'),
    },
    builderConfig: {
      output: {
        assetPrefix: 'https://www.foo.com',
      },
      performance: {
        prefetch: true,
      },
    },
  });

  const files = await builder.unwrapOutputJSON();

  const asyncFileName = Object.keys(files).find(file =>
    file.includes('/static/js/async/'),
  )!;
  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('index.html'),
  )!;

  // test.js、test.css、test.png
  expect(content.match(/rel="prefetch"/g)?.length).toBe(3);

  expect(
    content.includes(
      `<link href="https://www.foo.com${asyncFileName.slice(
        asyncFileName.indexOf('/static/js/async/'),
      )}" rel="prefetch">`,
    ),
  ).toBeTruthy();
});

test('should generate prefetch link correctly when assetPrefix do not have a protocol', async () => {
  const builder = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/page1/index.ts'),
    },
    builderConfig: {
      output: {
        assetPrefix: '//www.foo.com',
      },
      performance: {
        prefetch: true,
      },
    },
  });

  const files = await builder.unwrapOutputJSON();

  const asyncFileName = Object.keys(files).find(file =>
    file.includes('/static/js/async/'),
  )!;
  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('index.html'),
  )!;

  expect(
    content.includes(
      `<link href="//www.foo.com${asyncFileName.slice(
        asyncFileName.indexOf('/static/js/async/'),
      )}" rel="prefetch">`,
    ),
  ).toBeTruthy();
});

test('should generate prefetch link with filter', async () => {
  const builder = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/page1/index.ts'),
    },
    builderConfig: {
      performance: {
        prefetch: {
          include: [/.*\.png$/],
        },
      },
    },
  });

  const files = await builder.unwrapOutputJSON();

  const asyncFileName = Object.keys(files).find(file =>
    file.includes('/static/image/test'),
  )!;
  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('index.html'),
  )!;

  // test.js、test.css、test.png
  expect(content.match(/rel="prefetch"/g)?.length).toBe(1);

  expect(
    content.includes(
      `<link href="${asyncFileName.slice(
        asyncFileName.indexOf('/static/image/test'),
      )}" rel="prefetch">`,
    ),
  ).toBeTruthy();
});

webpackOnlyTest(
  'should generate prefetch link by config (distinguish html)',
  async () => {
    const builder = await build({
      cwd: fixtures,
      entry: {
        page1: join(fixtures, 'src/page1/index.ts'),
        page2: join(fixtures, 'src/page2/index.ts'),
      },
      builderConfig: {
        performance: {
          prefetch: {
            type: 'all-chunks',
          },
        },
      },
    });

    const files = await builder.unwrapOutputJSON();

    const [, content] = Object.entries(files).find(([name]) =>
      name.endsWith('page1/index.html'),
    )!;

    // icon.png、test.js、test.css、test.png
    expect(content.match(/rel="prefetch"/g)?.length).toBe(4);

    const assetFileName = Object.keys(files).find(file =>
      file.includes('/static/image/'),
    )!;

    expect(
      content.includes(
        `<link href="${assetFileName.slice(
          assetFileName.indexOf('/static/image/'),
        )}" rel="prefetch">`,
      ),
    ).toBeTruthy();

    const [, content2] = Object.entries(files).find(([name]) =>
      name.endsWith('page2/index.html'),
    )!;

    // test.js、test.css、test.png
    expect(content2.match(/rel="prefetch"/g)?.length).toBe(3);
  },
);

test('should generate preload link when preload is defined', async () => {
  const builder = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/page1/index.ts'),
    },
    builderConfig: {
      performance: {
        preload: true,
      },
    },
  });

  const files = await builder.unwrapOutputJSON();

  const asyncFileName = Object.keys(files).find(file =>
    file.includes('/static/js/async/'),
  )!;
  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('index.html'),
  )!;

  // test.js、test.css、test.png
  expect(content.match(/rel="preload"/g)?.length).toBe(3);

  expect(
    content.includes(
      `<link href="${asyncFileName.slice(
        asyncFileName.indexOf('/static/js/async/'),
      )}" rel="preload" as="script">`,
    ),
  ).toBeTruthy();
});

test('should generate preload link with crossOrigin', async () => {
  const builder = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/page1/index.ts'),
    },
    builderConfig: {
      html: {
        crossorigin: 'anonymous',
      },
      output: {
        assetPrefix: '//aaa.com',
      },
      performance: {
        preload: true,
      },
    },
  });

  const files = await builder.unwrapOutputJSON();

  const asyncFileName = Object.keys(files).find(file =>
    file.includes('/static/js/async/'),
  )!;
  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('.html'),
  )!;

  // test.js、test.css、test.png
  expect(content.match(/rel="preload"/g)?.length).toBe(3);

  expect(
    content.includes(
      `<link href="//aaa.com${asyncFileName.slice(
        asyncFileName.indexOf('/static/js/async/'),
      )}" rel="preload" as="script" crossorigin="">`,
    ),
  ).toBeTruthy();
});

test('should generate preload link without crossOrigin when same origin', async () => {
  const builder = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/page1/index.ts'),
    },
    builderConfig: {
      html: {
        crossorigin: 'anonymous',
      },
      performance: {
        preload: true,
      },
    },
  });

  const files = await builder.unwrapOutputJSON();

  const asyncFileName = Object.keys(files).find(file =>
    file.includes('/static/js/async/'),
  )!;
  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('.html'),
  )!;

  // test.js、test.css、test.png
  expect(content.match(/rel="preload"/g)?.length).toBe(3);

  expect(
    content.includes(
      `<link href="${asyncFileName.slice(
        asyncFileName.indexOf('/static/js/async/'),
      )}" rel="preload" as="script">`,
    ),
  ).toBeTruthy();
});
