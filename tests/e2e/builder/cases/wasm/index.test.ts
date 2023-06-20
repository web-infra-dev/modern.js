import path, { join } from 'path';
import { test, expect } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';

test('should allow to import wasm file', async ({ page }) => {
  const root = join(__dirname, 'wasm-basic');
  const builder = await build({
    cwd: root,
    entry: { main: path.resolve(root, 'src/index.js') },
    runServer: true,
  });
  const files = await builder.unwrapOutputJSON();

  const wasmFile = Object.keys(files).find(file =>
    file.endsWith('.module.wasm'),
  );

  expect(wasmFile).toBeTruthy();
  expect(wasmFile?.includes('static/wasm/')).toBeTruthy();

  await page.goto(getHrefByEntryName('main', builder.port));

  await page.waitForFunction(() => {
    return Boolean(document.querySelector('#root')?.innerHTML);
  });

  await expect(
    page.evaluate(`document.querySelector('#root').innerHTML`),
  ).resolves.toBe('6');

  builder.close();
});

test('should allow to dynamic import wasm file', async () => {
  const root = join(__dirname, 'wasm-async');
  const builder = await build({
    cwd: root,
    entry: { main: path.resolve(root, 'src/index.js') },
  });
  const files = await builder.unwrapOutputJSON();

  const wasmFile = Object.keys(files).find(file =>
    file.endsWith('.module.wasm'),
  );

  expect(wasmFile).toBeTruthy();
  expect(wasmFile?.includes('static/wasm/')).toBeTruthy();
});

test('should allow to use new URL to get path of wasm file', async ({
  page,
}) => {
  const root = join(__dirname, 'wasm-url');
  const builder = await build({
    cwd: root,
    entry: { main: path.resolve(root, 'src/index.js') },
    runServer: true,
  });
  const files = await builder.unwrapOutputJSON();

  const wasmFile = Object.keys(files).find(file =>
    file.endsWith('.module.wasm'),
  );

  expect(wasmFile).toBeTruthy();
  expect(wasmFile?.includes('static/wasm/')).toBeTruthy();

  await page.goto(getHrefByEntryName('main', builder.port));

  await page.waitForFunction(() => {
    return Boolean(document.querySelector('#root')?.innerHTML);
  });

  await expect(
    page.evaluate(`document.querySelector('#root').innerHTML`),
  ).resolves.toMatch(/\/static\/wasm\/\w+\.module\.wasm/);

  builder.close();
});
