import { join } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';
import { builderPluginVue2 } from '@modern-js/builder-plugin-vue2';

test('should build basic Vue sfc correctly', async ({ page }) => {
  const root = join(__dirname, 'sfc-basic');

  const builder = await build({
    cwd: root,
    entry: {
      main: join(root, 'src/index.js'),
    },
    runServer: true,
    plugins: [builderPluginVue2()],
  });

  await page.goto(getHrefByEntryName('main', builder.port));
  await expect(
    page.evaluate(`document.querySelector('#button1').innerHTML`),
  ).resolves.toBe('A: 0');
  await expect(
    page.evaluate(`document.querySelector('#button2').innerHTML`),
  ).resolves.toBe('B: 0');

  builder.close();
});

test('should build Vue sfc style correctly', async ({ page }) => {
  const root = join(__dirname, 'sfc-style');

  const builder = await build({
    cwd: root,
    entry: {
      main: join(root, 'src/index.js'),
    },
    runServer: true,
    plugins: [builderPluginVue2()],
  });

  await page.goto(getHrefByEntryName('main', builder.port));
  await expect(
    page.evaluate(
      `window.getComputedStyle(document.getElementById('button')).color`,
    ),
  ).resolves.toBe('rgb(255, 0, 0)');
  await expect(
    page.evaluate(`window.getComputedStyle(document.body).backgroundColor`),
  ).resolves.toBe('rgb(0, 0, 255)');

  builder.close();
});

test('should build basic Vue jsx correctly', async ({ page }) => {
  const root = join(__dirname, 'jsx-basic');

  const builder = await build({
    cwd: root,
    entry: {
      main: join(root, 'src/index.js'),
    },
    runServer: true,
    plugins: [builderPluginVue2()],
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(
    page.evaluate(`document.querySelector('#button1').innerHTML`),
  ).resolves.toBe('A: 0');

  builder.close();
});

test('should build Vue sfc with lang="ts" correctly', async ({ page }) => {
  const root = join(__dirname, 'sfc-lang-ts');

  const builder = await build({
    cwd: root,
    entry: {
      main: join(root, 'src/index.js'),
    },
    runServer: true,
    plugins: [builderPluginVue2()],
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(
    page.evaluate(`document.querySelector('#button').innerHTML`),
  ).resolves.toContain('count: 0 foo: bar');

  builder.close();
});

test('should build Vue sfc with lang="jsx" correctly', async ({ page }) => {
  const root = join(__dirname, 'sfc-lang-jsx');

  const builder = await build({
    cwd: root,
    entry: {
      main: join(root, 'src/index.js'),
    },
    runServer: true,
    plugins: [builderPluginVue2()],
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(
    page.evaluate(`document.querySelector('#button').innerHTML`),
  ).resolves.toBe('0');

  await expect(
    page.evaluate(`document.querySelector('#foo').innerHTML`),
  ).resolves.toBe('Foo');

  builder.close();
});

test('should build Vue sfc with lang="tsx" correctly', async ({ page }) => {
  const root = join(__dirname, 'sfc-lang-tsx');

  const builder = await build({
    cwd: root,
    entry: {
      main: join(root, 'src/index.js'),
    },
    runServer: true,
    plugins: [builderPluginVue2()],
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  await expect(
    page.evaluate(`document.querySelector('#button').innerHTML`),
  ).resolves.toBe('0');

  await expect(
    page.evaluate(`document.querySelector('#foo').innerHTML`),
  ).resolves.toBe('Foo');

  builder.close();
});
