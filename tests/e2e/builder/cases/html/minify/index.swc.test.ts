import { join } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build, getHrefByEntryName } from '@scripts/shared';
import { pluginSwc } from '@rsbuild/plugin-swc';

const fixtures = __dirname;

test('should minify template js & css correctly when use swc-plugin', async ({
  page,
}) => {
  const builder = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.ts'),
    },
    runServer: true,
    plugins: [pluginSwc()],
    builderConfig: {
      html: {
        template: './static/index.html',
      },
    },
  });

  await page.goto(getHrefByEntryName('main', builder.port));

  const test = page.locator('#test');

  await expect(test).toHaveCSS('text-align', 'center');
  await expect(test).toHaveCSS('font-size', '146px');
  await expect(test).toHaveText('Hello Builder!');
  await expect(page.evaluate(`window.b`)).resolves.toBe(2);

  const files = await builder.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find(file => file.endsWith('.html'))!];

  expect(
    content.includes('.test{font-size:146px;background-color:green}'),
  ).toBeTruthy();
  expect(
    content.includes('#a{text-align:center;line-height:1.5;font-size:1.5rem}'),
  ).toBeTruthy();
  expect(content.includes('window.a=1,window.b=2')).toBeTruthy();

  builder.close();
});
