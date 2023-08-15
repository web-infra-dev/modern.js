import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

test('should compile CSS with alias correctly', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    builderConfig: {
      source: {
        alias: {
          '@common': path.resolve(__dirname, 'src/common'),
        },
      },
    },
  });
  const files = await builder.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find(file => file.endsWith('.css'))!];

  if (builder.providerType === 'rspack') {
    expect(content).toEqual(
      '.the-a-class{color:red;background-image:url(/static/image/icon.c6be40ea.png)}.the-b-class{color:blue;background-image:url(/static/image/icon.c6be40ea.png)}.the-c-class{color:yellow;background-image:url(/static/image/icon.c6be40ea.png)}',
    );
  } else {
    expect(content).toEqual(
      '.the-a-class{color:red}.the-a-class,.the-b-class{background-image:url(/static/image/icon.6c12aba3.png)}.the-b-class{color:blue}.the-c-class{background-image:url(/static/image/icon.6c12aba3.png);color:#ff0}',
    );
  }
});
