import path from 'path';
import { test } from '@modern-js/e2e/playwright';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';

test('should inject tags', async () => {
  const builder = await createStubBuilder({
    webpack: true,
    entry: { index: path.resolve('./src/index.ts') },
    plugins: 'default',
    builderConfig: {
      html: {
        tags: [
          { tag: 'script', attrs: { src: 'foo.js' } },
          { tag: 'script', attrs: { src: 'bar.js' }, append: false },
          { tag: 'script', attrs: { src: 'baz.js' }, append: false },
          { tag: 'meta', attrs: { name: 'referrer', content: 'origin' } },
        ],
      },
    },
  });
  console.log(builder.context.distPath);
  const files = await builder.unwrapOutputJSON();
  console.log('files: ', Object.keys(files));
});
