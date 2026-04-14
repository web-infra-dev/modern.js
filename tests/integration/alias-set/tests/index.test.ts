import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
  modernBuild,
} from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');
const runtimeEntryFile = path.join(appDir, 'runtime/entry.mjs');
const loaderFile = path.resolve(
  __dirname,
  '../../../../packages/solutions/app-tools/src/esm/ts-paths-loader.mjs',
);

function existsSync(filePath: string) {
  return fs.existsSync(path.join(appDir, 'dist', filePath));
}

describe('alias set build', () => {
  test(`should get right alias build!`, async () => {
    const buildRes = await modernBuild(appDir);
    expect(buildRes.code === 0).toBe(true);
    expect(existsSync('route.json')).toBe(true);
    expect(existsSync('html/index/index.html')).toBe(true);
  });

  test('should resolve runtime alias with node loader under file parent url', () => {
    const result = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        `
          import { register } from 'node:module';
          import { pathToFileURL } from 'node:url';

          const appDir = ${JSON.stringify(appDir)};
          register(pathToFileURL(${JSON.stringify(loaderFile)}).href, import.meta.url, {
            data: {
              appDir,
              baseUrl: appDir,
              paths: {
                '@common/*': ['src/common/*'],
              },
            },
          });

          const mod = await import(pathToFileURL(${JSON.stringify(runtimeEntryFile)}).href);
          process.stdout.write(String(mod.default));
        `,
      ],
      {
        cwd: appDir,
        encoding: 'utf8',
      },
    );

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('alias runtime ok');
    expect(result.stderr.trim()).toBe('');
  });

  test('should not resolve runtime alias for file parent outside app dir', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'modern-alias-set-'));
    const tempEntryFile = path.join(tempDir, 'entry.mjs');

    fs.writeFileSync(
      tempEntryFile,
      `import value from '@common/runtime-value.mjs';\nexport default value;\n`,
    );

    const result = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        `
          import { register } from 'node:module';
          import { pathToFileURL } from 'node:url';

          const appDir = ${JSON.stringify(appDir)};
          register(pathToFileURL(${JSON.stringify(loaderFile)}).href, import.meta.url, {
            data: {
              appDir,
              baseUrl: appDir,
              paths: {
                '@common/*': ['src/common/*'],
              },
            },
          });

          await import(pathToFileURL(${JSON.stringify(tempEntryFile)}).href);
        `,
      ],
      {
        cwd: appDir,
        encoding: 'utf8',
      },
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('@common/runtime-value.mjs');
  });
});

describe('alias set dev', () => {
  test(`should render page correctly`, async () => {
    const appPort = await getPort();
    const app = await launchApp(
      appDir,
      appPort,
      {},
      {
        // FIXME: disable the fast refresh plugin to avoid the `require` not found issue.
        FAST_REFRESH: 'false',
      },
    );
    const errors = [];

    const browser = await puppeteer.launch(launchOptions as any);
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push((error as Error).message));
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });

    const root = await page.$('#root');
    const targetText = await page.evaluate(el => el?.textContent, root);
    expect(targetText?.trim()).toEqual('Hello Modern.js! 1');
    expect(errors.length).toEqual(0);

    await browser.close();
    await killApp(app);
  });
});
