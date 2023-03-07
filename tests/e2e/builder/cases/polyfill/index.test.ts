import path from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { webpackOnlyTest } from '@scripts/helper';
import { build } from '@scripts/shared';

const getPolyfillContent = (files: Record<string, string>) => {
  const polyfillFileName = Object.keys(files).find(
    file => file.includes('lib-polyfill') && file.endsWith('.js.map'),
  );

  const indexFileName = Object.keys(files).find(
    file => file.includes('index') && file.endsWith('.js.map'),
  )!;

  const content = polyfillFileName
    ? files[polyfillFileName]
    : files[indexFileName];
  return content;
};

webpackOnlyTest(
  'should add polyfill when set polyfill entry (default)',
  async () => {
    const builder = await build({
      cwd: __dirname,
      entry: { index: path.resolve(__dirname, './src/index.js') },
    });
    const files = await builder.unwrapOutputJSON(false);

    const content = getPolyfillContent(files);

    // should polyfill all api
    expect(content.includes('es.array.flat.js')).toBeTruthy();
    expect(content.includes('String.prototype.trimEnd')).toBeTruthy();
  },
);

webpackOnlyTest('should add polyfill when set polyfill usage', async () => {
  const builder = await build(
    {
      cwd: __dirname,
      entry: { index: path.resolve(__dirname, './src/index.js') },
    },
    {
      output: {
        polyfill: 'usage',
      },
    },
  );
  const files = await builder.unwrapOutputJSON(false);

  const content = getPolyfillContent(files);

  // should only polyfill some usage api
  expect(content.includes('es.array.flat.js')).toBeTruthy();
  expect(content.includes('String.prototype.trimEnd')).toBeFalsy();
});
