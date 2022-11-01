import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';

test('should external react correctly', async () => {
  const builder = await createStubBuilder({
    webpack: true,
    entry: { index: path.resolve('./src/index.js') },
    builderConfig: {
      output: {
        externals: {
          react: 'MyReact',
        },
      },
    },
  });
  const files = await builder.unwrapOutputJSON();

  const content = files[Object.keys(files).find(file => file.endsWith('.js'))!];
  expect(content.includes('MyReact')).toBeTruthy();
});

test('should not external dependencies when target is web worker', async () => {
  const builder = await createStubBuilder({
    webpack: true,
    target: 'web-worker',
    entry: { index: path.resolve('./src/index.js') },
    builderConfig: {
      output: {
        externals: {
          react: 'MyReact',
        },
      },
    },
  });
  const files = await builder.unwrapOutputJSON();

  const content = files[Object.keys(files).find(file => file.endsWith('.js'))!];
  expect(content.includes('MyReact')).toBeFalsy();
});
