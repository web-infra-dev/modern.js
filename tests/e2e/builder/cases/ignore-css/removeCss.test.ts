import path from 'path';
import { test, expect } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

test('should ignore css content when build node target', async () => {
  const builder = await build({
    cwd: __dirname,

    target: 'node',
    entry: { index: path.resolve(__dirname, './src/index.js') },
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
  const builder = await build({
    cwd: __dirname,
    target: 'web-worker',
    entry: { index: path.resolve(__dirname, './src/index.js') },
  });
  const files = await builder.unwrapOutputJSON();

  const content = files[Object.keys(files).find(file => file.endsWith('.js'))!];

  // preserve css modules mapping
  expect(content.includes('"title-class":')).toBeTruthy();
  // remove css content
  expect(content.includes('.title-class')).toBeFalsy();
  expect(content.includes('.header-class')).toBeFalsy();
});
