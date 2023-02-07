import { join, resolve } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { stubBuild } from '../scripts/shared';

const fixtures = resolve(__dirname, '../fixtures/performance');

test.describe('performance configure multi', () => {
  let files: Record<string, string>;
  const basicFixtures = resolve(__dirname, '../fixtures/performance/basic');

  test.beforeAll(async () => {
    const builder = await stubBuild(
      {
        cwd: basicFixtures,
        entry: {
          main: join(basicFixtures, 'src/index.ts'),
        },
      },
      {
        performance: {
          bundleAnalyze: {},
          chunkSplit: {
            strategy: 'all-in-one',
          },
        },
      },
    );

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
  const builder = await stubBuild(
    {
      cwd: join(fixtures, 'removeConsole'),
      entry: {
        main: join(fixtures, 'removeConsole/src/index.js'),
      },
    },
    {
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
        removeConsole: ['log', 'warn'],
      },
    },
  );

  const files = await builder.unwrapOutputJSON();

  const [, jsFile] = Object.entries(files).find(
    ([name, content]) => name.endsWith('.js') && content,
  )!;

  expect(jsFile.includes('test-console-debug')).toBeTruthy();
  expect(jsFile.includes('test-console-info')).toBeFalsy();
  expect(jsFile.includes('test-console-warn')).toBeFalsy();
  expect(jsFile.includes('test-console-error')).toBeTruthy();
});
