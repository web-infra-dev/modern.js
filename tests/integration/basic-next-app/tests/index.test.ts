import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import {
  launchApp,
  killApp,
  getPort,
  modernBuild,
  modernServe,
  launchOptions,
} from '../../../utils/modernTestUtils';

import { SequenceWait } from '../../../utils/testInSequence';

const appDir = path.resolve(__dirname, '../');

function existsSync(filePath: string) {
  return fs.existsSync(path.join(appDir, 'dist', filePath));
}

const curSequence = new SequenceWait();
curSequence.add('dev');

describe('test dev', () => {
  afterAll(async () => {
    await curSequence.done('dev');
  });
  test(`should render page correctly`, async () => {
    const appPort = await getPort();
    const app = await launchApp(appDir, appPort, {}, {});
    const errors = [];
    const browser = await puppeteer.launch(launchOptions as any);
    const page = await browser.newPage();
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });

    const root = await page.$('.description');
    const targetText = await page.evaluate(el => el?.textContent, root);
    expect(targetText?.trim()).toEqual('Get started by editing src/App.tsx');
    expect(errors.length).toEqual(0);

    await killApp(app);
    await page.close();
    await browser.close();
  });
});

describe('test build', () => {
  let port = 8080;
  let buildRes: { code: number };
  let app: any;
  beforeAll(async () => {
    await curSequence.waitUntil('dev');
    port = await getPort();

    process.env.DEBUG = 'rsbuild';
    buildRes = await modernBuild(appDir);

    app = await modernServe(appDir, port, {
      cwd: appDir,
    });
  });

  afterAll(async () => {
    await killApp(app);
    delete process.env.DEBUG;
  });

  test(`should get right alias build!`, async () => {
    expect(buildRes.code === 0).toBe(true);
    expect(existsSync('route.json')).toBe(true);
    expect(existsSync('html/main/index.html')).toBe(true);
  });

  test(`should not use babel-loader`, async () => {
    const configPath = path.join(
      appDir,
      'dist',
      '.rsbuild/rspack.config.web.mjs',
    );
    const configContent = fs.readFileSync(configPath, { encoding: 'utf-8' });

    expect(configContent.includes('babel-loader')).toBeFalsy();
  });

  test('should support enableInlineScripts', async () => {
    const host = `http://localhost`;
    expect(buildRes.code === 0).toBe(true);
    const browser = await puppeteer.launch(launchOptions as any);
    const page = await browser.newPage();
    await page.goto(`${host}:${port}`);

    const description = await page.$('.description');
    const targetText = await page.evaluate(el => el?.textContent, description);
    expect(targetText?.trim()).toEqual('Get started by editing src/App.tsx');
    await page.close();
    await browser.close();
  });
});
