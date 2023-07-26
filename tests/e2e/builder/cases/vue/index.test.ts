import { join } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';
import { builderPluginVue } from '@modern-js/builder-plugin-vue';

test('should build basic Vue sfc correctly', async ({ page }) => {
  const root = join(__dirname, 'sfc-basic');

  const builder = await build({
    cwd: root,
    entry: {
      main: join(root, 'src/index.js'),
    },
    runServer: true,
    plugins: [builderPluginVue()],
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const button1 = page.locator('#button1');
  const button2 = page.locator('#button2');

  await expect(button1).toHaveText('A: 0');
  await expect(button2).toHaveText('B: 0');

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
    plugins: [builderPluginVue()],
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const button = page.locator('#button');
  await expect(button).toHaveCSS('color', 'rgb(255, 0, 0)');

  const body = page.locator('body');
  await expect(body).toHaveCSS('background-color', 'rgb(0, 0, 255)');

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
    plugins: [builderPluginVue()],
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const button1 = page.locator('#button1');
  await expect(button1).toHaveText('A: 0');

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
    plugins: [builderPluginVue()],
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const button = page.locator('#button');
  await expect(button).toHaveText('count: 0 foo: bar');

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
    plugins: [builderPluginVue()],
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const button = page.locator('#button');
  await expect(button).toHaveText('0');

  const foo = page.locator('#foo');
  await expect(foo).toHaveText('Foo');

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
    plugins: [builderPluginVue()],
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const button = page.locator('#button');
  await expect(button).toHaveText('0');

  const foo = page.locator('#foo');
  await expect(foo).toHaveText('Foo');

  builder.close();
});
