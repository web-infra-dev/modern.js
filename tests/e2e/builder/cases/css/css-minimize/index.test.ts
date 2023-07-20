import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

test('should minimize CSS correctly', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    builderConfig: {},
  });
  const files = await builder.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find(file => file.endsWith('.css'))!];

  if (builder.providerType === 'rspack') {
    expect(content).toEqual(
      '.a{text-align:center;line-height:1.5;font-size:1.5rem}.b{text-align:center;line-height:1.5;font-size:1.5rem;background:#fafafa}',
    );
  } else {
    expect(content).toEqual(
      '.a,.b{font-size:1.5rem;line-height:1.5;text-align:center}.b{background:#fafafa}',
    );
  }
});
