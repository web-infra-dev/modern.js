import path, { join } from 'path';
import { execa, fs } from '@modern-js/utils';
import puppeteer from 'puppeteer';
import {
  getPort,
  killApp,
  launchOptions,
  modernBuild,
  modernServe,
  runContinuousTask,
} from '../../../utils/modernTestUtils';

rstest.setConfig({ testTimeout: 1000 * 60 * 3, hookTimeout: 1000 * 60 * 3 });

const fixtureDir = path.resolve(__dirname, '../fixtures');
const appDir = join(fixtureDir, 'nested-routes');

describe('ssg', () => {
  let app: any;
  let distDir: string;
  beforeAll(async () => {
    distDir = join(appDir, './dist');
    await modernBuild(appDir);
  });
  afterAll(async () => {
    await killApp(app);
  });

  test('should nested-routes ssg access / work correctly', async () => {
    const htmlPath = path.join(distDir, 'html/index/index.html');
    const html = (await fs.readFile(htmlPath)).toString();
    expect(html.includes('Hello, Home')).toBe(true);
  });

  test('should nested-routes ssg access /user work correctly', async () => {
    const htmlPath = path.join(distDir, 'html/index/user/index.html');
    const html = (await fs.readFile(htmlPath)).toString();
    expect(html.includes('Hello, User')).toBe(true);
  });

  test('should nested-routes ssg access /user/1 work correctly with data loading', async () => {
    const htmlPath = path.join(distDir, 'html/index/user/1/index.html');
    const html = (await fs.readFile(htmlPath)).toString();
    expect(html.includes('User 1: John Doe')).toBe(true);
    expect(html.includes('User ID: <!-- -->1')).toBe(true);
  });
});

describe('test ssg request', () => {
  let buildRes: { code: number };
  let app: any;
  let port: any;
  beforeAll(async () => {
    port = await getPort();

    buildRes = await modernBuild(appDir);
    app = await modernServe(appDir, port, {
      cwd: appDir,
    });
  });

  afterAll(async () => {
    await killApp(app);
  });

  test('should visit page correctly', async () => {
    const host = `http://localhost`;
    expect(buildRes.code === 0).toBe(true);
    const browser = await puppeteer.launch(launchOptions as any);
    const page = await browser.newPage();
    await page.goto(`${host}:${port}/user`);

    const description = await page.$('#data');
    const targetText = await page.evaluate(el => el?.textContent, description);
    try {
      expect(targetText?.trim()).toEqual('Hello, User');
    } finally {
      await page.close();
      await browser.close();
    }
  });

  test('should visit dynamic route /user/1 correctly with data loading', async () => {
    const host = `http://localhost`;
    expect(buildRes.code === 0).toBe(true);
    const browser = await puppeteer.launch(launchOptions as any);
    const page = await browser.newPage();
    await page.goto(`${host}:${port}/user/1`);

    const dataElement = await page.$('#data');
    const paramsElement = await page.$('#params');
    const dataText = await page.evaluate(el => el?.textContent, dataElement);
    const paramsText = await page.evaluate(
      el => el?.textContent,
      paramsElement,
    );

    try {
      expect(dataText?.trim()).toEqual('User 1: John Doe');
      expect(paramsText?.trim()).toEqual('User ID: 1');
    } finally {
      await page.close();
      await browser.close();
    }
  });
});

test('deploys successful SSG pages and falls back for skipped or unknown paths', async () => {
  const config = 'modern.fallback.config.ts';
  const build = await modernBuild(appDir, ['--config', config]);
  expect(build.code).toBe(0);
  await execa('npx', ['modern', 'deploy', '--skip-build', '--config', config], {
    cwd: appDir,
  });
  const output = join(appDir, '.output');
  expect(
    fs.existsSync(join(output, 'html/index/user/missing/index.html')),
  ).toBe(false);
  const { routes } = await fs.readJSON(join(output, 'route.json'));
  expect(
    routes.some(
      (route: { urlPath: string }) => route.urlPath === '/user/missing',
    ),
  ).toBe(false);

  const port = await getPort();
  const app = await runContinuousTask(['.output/index.js'], undefined, {
    cwd: appDir,
    env: { ...process.env, NODE_ENV: 'production', PORT: port },
    waitMessage: /Server is listening on/i,
  });
  try {
    const host = `http://localhost:${port}`;
    for (const [pathname, content] of [
      ['/user', 'Hello, User'],
      ['/user/1', 'User 1: John Doe'],
    ]) {
      const response = await fetch(`${host}${pathname}`);
      expect(response.status).toBe(200);
      expect(await response.text()).toContain(content);
    }
    const shell = await (await fetch(host)).text();
    for (const pathname of [
      '/user/missing',
      '/user/does-not-exist',
      '/unknown/path',
    ]) {
      const response = await fetch(`${host}${pathname}`);
      expect(response.status).toBe(200);
      expect(await response.text()).toBe(shell);
    }
  } finally {
    await killApp(app);
  }
});
