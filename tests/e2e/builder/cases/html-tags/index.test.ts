import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

const isHtmlMatch = (html: string, pattern: RegExp): boolean =>
  Boolean(html.match(pattern));

test('should inject tags', async () => {
  const builder = await build(
    {
      cwd: __dirname,
      entry: { index: path.resolve(__dirname, './src/index.ts') },
    },
    {
      html: {
        tags: [
          { tag: 'script', attrs: { src: 'foo.js' } },
          { tag: 'script', attrs: { src: 'bar.js' }, append: false },
          { tag: 'script', attrs: { src: 'baz.js' }, append: false },
          { tag: 'meta', attrs: { name: 'referrer', content: 'origin' } },
        ],
      },
    },
    false,
  );

  const files = await builder.unwrapOutputJSON();

  const indexHtml =
    files[path.resolve(__dirname, './dist/html/index/index.html')];

  expect(isHtmlMatch(indexHtml, /foo\.js/)).toBeTruthy();
  expect(isHtmlMatch(indexHtml, /content="origin"/)).toBeTruthy();
});
