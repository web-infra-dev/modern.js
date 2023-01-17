import path from 'path';
import { test } from '@modern-js/e2e/playwright';
import { builderPluginImageCompress } from '@modern-js/builder-plugin-image-compress';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';

test('should handle unknown modules with fallback rule', async () => {
  const builder = await createStubBuilder({
    webpack: true,
    entry: { index: path.resolve('./src/index.js') },
    plugins: [builderPluginImageCompress()],
  });
  await builder.build();
});
