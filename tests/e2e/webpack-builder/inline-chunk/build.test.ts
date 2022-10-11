import path from 'path';
import { readdir, readFile, lstat } from 'fs/promises';
import { expect, test } from '@modern-js/e2e/playwright';
import { RUNTIME_CHUNK_NAME } from '@modern-js/builder-shared';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';

const readDistFiles = async (
  baseDir: string,
  currDir = '',
): Promise<Record<string, string>> => {
  const distPath = path.join(baseDir, currDir);
  const items = await readdir(distPath);
  let ret: Record<string, string> = {};
  for (const item of items) {
    const stat = await lstat(path.join(distPath, item));
    if (stat.isDirectory()) {
      const part = await readDistFiles(baseDir, path.join(currDir, item));
      ret = { ...ret, ...part };
    } else {
      ret[path.join(currDir, item)] = await readFile(
        path.join(baseDir, currDir, item),
        'utf-8',
      );
    }
  }
  return ret;
};

test('inline runtime chunk by default', async () => {
  const distPathRoot = path.join(__dirname, 'dist');
  const builder = await createStubBuilder({
    webpack: 'in-memory',
    plugins: {
      builtin: 'default',
      additional: [],
    },
    entry: { index: path.resolve('./src/index.js') },
    builderConfig: {
      output: {
        distPath: {
          root: distPathRoot,
        },
      },
    },
  });
  await builder.build();
  const files = await readDistFiles(distPathRoot);

  // no builder-runtime file in output
  expect(
    Object.keys(files).some(fileName => fileName.includes(RUNTIME_CHUNK_NAME)),
  ).toBe(false);

  // found builder-runtime file in html
  const indexHtml = files['html/index/index.html'];
  expect(
    indexHtml.match(new RegExp(`${RUNTIME_CHUNK_NAME}\\.(.+)\\.js\\.map`)),
  ).toBeTruthy();
});
