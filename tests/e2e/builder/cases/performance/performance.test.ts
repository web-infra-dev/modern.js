import { join, resolve } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

const fixtures = __dirname;

test.describe('performance configure multi', () => {
  let files: Record<string, string>;
  const basicFixtures = resolve(__dirname, 'basic');

  test.beforeAll(async () => {
    const builder = await build({
      cwd: basicFixtures,
      entry: {
        main: join(basicFixtures, 'src/index.ts'),
      },
      builderConfig: {
        performance: {
          bundleAnalyze: {},
          chunkSplit: {
            strategy: 'all-in-one',
          },
        },
      },
    });

    files = await builder.unwrapOutputJSON();
  });

  test('bundleAnalyze', async () => {
    const filePaths = Object.keys(files).filter(file =>
      file.endsWith('report-web.html'),
    );

    expect(filePaths.length).toBe(1);
  });

  test('chunkSplit all-in-one', async () => {
    // expect only one bundle (end with .js)
    const filePaths = Object.keys(files).filter(file => file.endsWith('.js'));

    expect(filePaths.length).toBe(1);
  });
});

test('removeConsole', async () => {
  const builder = await build({
    cwd: join(fixtures, 'removeConsole'),
    entry: {
      main: join(fixtures, 'removeConsole/src/index.js'),
    },
    builderConfig: {
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
        removeConsole: ['log', 'warn'],
      },
    },
  });

  const files = await builder.unwrapOutputJSON();

  const [, jsFile] = Object.entries(files).find(
    ([name, content]) => name.endsWith('.js') && content,
  )!;

  expect(jsFile.includes('test-console-debug')).toBeTruthy();
  expect(jsFile.includes('test-console-info')).toBeFalsy();
  expect(jsFile.includes('test-console-warn')).toBeFalsy();
  expect(jsFile.includes('test-console-error')).toBeTruthy();
});

test('should generate vendor chunk when chunkSplit is "single-vendor"', async () => {
  const builder = await build({
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(fixtures, 'basic/src/index.ts'),
    },
    builderConfig: {
      performance: {
        chunkSplit: {
          strategy: 'single-vendor',
        },
      },
    },
  });

  const files = await builder.unwrapOutputJSON();

  const [vendorFile] = Object.entries(files).find(
    ([name, content]) => name.includes('vendor') && content.includes('React'),
  )!;

  expect(vendorFile).toBeTruthy();
});

test('should generate preconnect link when preconnect is defined', async () => {
  const builder = await build({
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(fixtures, 'basic/src/index.ts'),
    },
    builderConfig: {
      performance: {
        preconnect: [
          {
            href: 'http://aaaa.com',
          },
          {
            href: 'http://bbbb.com',
            crossorigin: true,
          },
        ],
      },
    },
  });

  const files = await builder.unwrapOutputJSON();

  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('index.html'),
  )!;

  expect(
    content.includes('<link rel="preconnect" href="http://aaaa.com">'),
  ).toBeTruthy();

  expect(
    content.includes(
      '<link rel="preconnect" href="http://bbbb.com" crossorigin>',
    ),
  ).toBeTruthy();
});

test('should generate dnsPrefetch link when dnsPrefetch is defined', async () => {
  const builder = await build({
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(fixtures, 'basic/src/index.ts'),
    },
    builderConfig: {
      performance: {
        dnsPrefetch: ['http://aaaa.com'],
      },
    },
  });

  const files = await builder.unwrapOutputJSON();

  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('index.html'),
  )!;

  expect(
    content.includes('<link rel="dns-prefetch" href="http://aaaa.com">'),
  ).toBeTruthy();
});

test('should generate prefetch link when prefetch is defined', async () => {
  const builder = await build({
    cwd: join(fixtures, 'load-resource'),
    entry: {
      main: join(fixtures, 'load-resource/src/index.ts'),
    },
    builderConfig: {
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

  expect(content.match(/rel="prefetch"/g)?.length).toBe(1);

  expect(
    content.includes(
      `<link href="${asyncFileName.slice(
        asyncFileName.indexOf('/static/js/async/'),
      )}" rel="prefetch">`,
    ),
  ).toBeTruthy();
});

test('should generate prefetch link by config', async () => {
  const builder = await build({
    cwd: join(fixtures, 'load-resource'),
    entry: {
      main: join(fixtures, 'load-resource/src/index.ts'),
    },
    builderConfig: {
      performance: {
        prefetch: {
          type: 'all-assets',
        },
      },
    },
  });

  const files = await builder.unwrapOutputJSON();

  const [, content] = Object.entries(files).find(([name]) =>
    name.endsWith('index.html'),
  )!;

  expect(content.match(/rel="prefetch"/g)?.length).toBe(2);

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
});

test('should generate preload link when preload is defined', async () => {
  const builder = await build({
    cwd: join(fixtures, 'load-resource'),
    entry: {
      main: join(fixtures, 'load-resource/src/index.ts'),
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

  expect(content.match(/rel="preload"/g)?.length).toBe(1);

  expect(
    content.includes(
      `<link href="${asyncFileName.slice(
        asyncFileName.indexOf('/static/js/async/'),
      )}" rel="preload" as="script">`,
    ),
  ).toBeTruthy();
});
