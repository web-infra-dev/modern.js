import path, { join } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { dev } from '@scripts/shared';
import { fse } from '@rsbuild/shared';

const cwd = join(__dirname, 'history-api-fallback');

test('should provide history api fallback correctly', async ({ page }) => {
  const builder = await dev({
    cwd,
    entry: {
      main: join(cwd, 'src/index.tsx'),
    },
    serverOptions: {
      routes: (await fse.readJSON(path.join(cwd, 'dist', 'route.json'))).routes,
    },
    builderConfig: {
      tools: {
        devServer: {
          historyApiFallback: true,
        },
      },
    },
  });

  await page.goto(`http://localhost:${builder.port}`);
  expect(await page.innerHTML('body')).toContain('<div>home<div>');

  await page.goto(`http://localhost:${builder.port}/a`);
  expect(await page.innerHTML('body')).toContain('<div>A</div>');

  await page.goto(`http://localhost:${builder.port}/b`);
  expect(await page.innerHTML('body')).toContain('<div>B</div>');

  await builder.server.close();
});
