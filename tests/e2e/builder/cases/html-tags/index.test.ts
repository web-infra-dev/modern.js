import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

const isHtmlMatch = (html: string, pattern: RegExp): boolean =>
  Boolean(html.match(pattern));

test('should inject tags', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.ts') },
    builderConfig: {
      html: {
        tags: [
          { tag: 'script', attrs: { src: 'foo.js' } },
          { tag: 'script', attrs: { src: 'https://www.cdn.com/foo.js' } },
          { tag: 'script', attrs: { src: 'bar.js' }, append: false },
          { tag: 'script', attrs: { src: 'baz.js' }, append: false },
          { tag: 'meta', attrs: { name: 'referrer', content: 'origin' } },
        ],
      },
    },
  });

  const files = await builder.unwrapOutputJSON();

  const indexHtml =
    files[path.resolve(__dirname, './dist/html/index/index.html')];

  expect(isHtmlMatch(indexHtml, /foo\.js/)).toBeTruthy();
  expect(
    isHtmlMatch(indexHtml, /src="https:\/\/www\.cdn\.com\/foo\.js/),
  ).toBeTruthy();
  expect(isHtmlMatch(indexHtml, /content="origin"/)).toBeTruthy();
});

test('should inject tags by tagsByEntries', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.ts') },
    builderConfig: {
      html: {
        tags: [
          { tag: 'script', attrs: { src: 'foo.js' } },
          { tag: 'script', attrs: { src: 'https://www.cdn.com/foo.js' } },
        ],
        tagsByEntries: {
          index: [
            tags => {
              // should get bar tag info
              if (tags.find(tag => tag.attrs?.src === 'bar.js')) {
                tags.push({
                  tag: 'meta',
                  attrs: { name: 'referrer', content: 'origin' },
                });
              }
            },

            tags => [
              ...tags,
              { tag: 'script', attrs: { src: 'baz.js' }, append: false },
            ],
            { tag: 'script', attrs: { src: 'bar.js' }, append: false },
          ],
          index2: [{ tag: 'script', attrs: { src: '404.js' }, append: false }],
        },
      },
    },
  });

  const files = await builder.unwrapOutputJSON();

  const indexHtml =
    files[path.resolve(__dirname, './dist/html/index/index.html')];

  expect(isHtmlMatch(indexHtml, /bar\.js/)).toBeTruthy();
  expect(isHtmlMatch(indexHtml, /foo\.js/)).toBeTruthy();
  expect(
    isHtmlMatch(indexHtml, /src="https:\/\/www\.cdn\.com\/foo\.js/),
  ).toBeTruthy();
  expect(isHtmlMatch(indexHtml, /content="origin"/)).toBeTruthy();
  expect(isHtmlMatch(indexHtml, /404\.js/)).toBeFalsy();
});
