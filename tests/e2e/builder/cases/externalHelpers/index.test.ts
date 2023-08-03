import path from 'path';
import { build } from '@scripts/shared';
import { providerType } from '@scripts/helper';
import { expect, test } from '@modern-js/e2e/playwright';
import { builderPluginSwc } from '@modern-js/builder-plugin-swc';

test('should externalHelpers by default', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/main.ts') },
    plugins: providerType === 'rspack' ? [] : [builderPluginSwc()],
  });
  const files = await builder.unwrapOutputJSON(false);

  const content =
    files[
      Object.keys(files).find(
        file => file.includes('static/js') && file.endsWith('.js.map'),
      )!
    ];

  expect(content).toContain('@swc/helpers');
});
