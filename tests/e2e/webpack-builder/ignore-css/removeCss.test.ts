import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';

test('should ignore css content when build node target', async () => {
  const builder = await createStubBuilder({
    webpack: true,
    target: 'node',
    entry: { index: path.resolve('./src/index.js') },
  });
  const files = await builder.unwrapOutputJSON();

  const content = files[Object.keys(files).find(file => file.endsWith('.js'))!];

  // preserve css modules mapping
  expect(content.includes('"title-class":')).toBeTruthy();
  // remove css content
  expect(content.includes('.title-class')).toBeFalsy();
  expect(content.includes('.header-class')).toBeFalsy();
});

test('should ignore css content when build web-worker target', async () => {
  const builder = await createStubBuilder({
    webpack: true,
    target: 'web-worker',
    entry: { index: path.resolve('./src/index.js') },
  });
  const files = await builder.unwrapOutputJSON();

  const content = files[Object.keys(files).find(file => file.endsWith('.js'))!];

  // preserve css modules mapping
  expect(content.includes('"title-class":')).toBeTruthy();
  // remove css content
  expect(content.includes('.title-class')).toBeFalsy();
  expect(content.includes('.header-class')).toBeFalsy();
});
