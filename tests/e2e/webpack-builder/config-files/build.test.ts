import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { createStubBuilder } from '@modern-js/webpack-builder/stub';
import { PluginHtml } from '@modern-js/webpack-builder/plugins/html';
import { PluginEntry } from '@modern-js/webpack-builder/plugins/entry';
import { PluginToml } from '@modern-js/webpack-builder/plugins/toml';
import { PluginYaml } from '@modern-js/webpack-builder/plugins/yaml';

test('load config files', async ({ page }) => {
  const builder = await createStubBuilder({
    webpack: 'in-memory',
    plugins: {
      builtin: false,
      additional: [PluginEntry(), PluginHtml(), PluginToml(), PluginYaml()],
    },
    entry: { index: path.resolve('./src/index.js') },
  });
  const { homeUrl } = await builder.buildAndServe();
  await page.goto(homeUrl.href);
  const tomlData = await page.evaluate('window.tomlData');
  const yamlData = await page.evaluate('window.yamlData');
  const ymlData = await page.evaluate('window.ymlData');
  expect(JSON.stringify(tomlData)).toMatchSnapshot('toml.json');
  expect(JSON.stringify(yamlData)).toMatchSnapshot('yaml.json');
  expect(JSON.stringify(ymlData)).toMatchSnapshot('yml.json');
});
