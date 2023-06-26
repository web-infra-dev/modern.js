import { join, dirname } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { fs } from '@modern-js/utils';
import { build } from '@scripts/shared';

const fixtures = __dirname;

test.describe('output configure multi', () => {
  const distFilePath = join(fixtures, 'rem/dist-1/test.json');

  let builder: Awaited<ReturnType<typeof build>>;

  test.beforeAll(async () => {
    await fs.mkdir(dirname(distFilePath), { recursive: true });
    await fs.writeFile(
      distFilePath,
      `{
      "test": 1
    }`,
    );

    builder = await build({
      cwd: join(fixtures, 'rem'),
      entry: {
        main: join(fixtures, 'rem/src/index.ts'),
      },
      builderConfig: {
        output: {
          distPath: {
            root: 'dist-1',
            js: 'aa/js',
          },
          copy: [{ from: './src/assets', to: '' }],
        },
      },
    });
  });

  test.afterAll(async () => {
    builder.close();
    await builder.clean();
  });

  test('cleanDistPath default (enable)', async () => {
    expect(fs.existsSync(distFilePath)).toBeFalsy();
  });

  test('copy', async () => {
    expect(fs.existsSync(join(fixtures, 'rem/dist-1/icon.png'))).toBeTruthy();
  });

  test('distPath', async () => {
    expect(
      fs.existsSync(join(fixtures, 'rem/dist-1/html/main/index.html')),
    ).toBeTruthy();

    expect(fs.existsSync(join(fixtures, 'rem/dist-1/aa/js'))).toBeTruthy();
  });
});

test('cleanDistPath disable', async () => {
  const distFilePath = join(fixtures, 'rem/dist-2/test.json');

  await fs.mkdir(dirname(distFilePath), { recursive: true });
  await fs.writeFile(
    distFilePath,
    `{
    "test": 1
  }`,
  );

  const builder = await build({
    cwd: join(fixtures, 'rem'),
    entry: {
      main: join(fixtures, 'rem/src/index.ts'),
    },
    builderConfig: {
      output: {
        distPath: {
          root: 'dist-2',
        },
        cleanDistPath: false,
      },
    },
  });

  expect(fs.existsSync(distFilePath)).toBeTruthy();

  builder.close();
  builder.clean();
});
