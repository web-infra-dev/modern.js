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

async function checkSsgResponses(port: number, distDir: string) {
  expect(
    fs.existsSync(join(distDir, 'html/index/blog/scheduled/index.html')),
  ).toBe(false);
  const { routes } = await fs.readJSON(join(distDir, 'route.json'));
  expect(
    routes.some(
      (route: { urlPath: string }) => route.urlPath === '/blog/scheduled',
    ),
  ).toBe(false);
  for (const [pathname, expected] of [
    ['/blog', 'BLOG LIST PAGE'],
    ['/blog/', 'BLOG LIST PAGE'],
    ['/blog/hello', 'Hello world'],
    ['/', 'Hello, Home'],
  ]) {
    const response = await fetch(`http://localhost:${port}${pathname}`);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain(expected);
  }
  for (const pathname of [
    '/blog/does-not-exist',
    '/blog/scheduled',
    '/blog/hello/child',
    '/unknown/path',
  ]) {
    const response = await fetch(`http://localhost:${port}${pathname}`);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).not.toContain('BLOG LIST PAGE');
    expect(html).not.toContain('Hello, Home');
    expect(html).not.toContain('Unexpected Application Error');
  }
}

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

  test('serves only successful SSG paths and falls back to the original CSR shell', async () => {
    expect(buildRes.code).toBe(0);
    await checkSsgResponses(port, join(appDir, 'dist'));
  });

  test('preserves SSG matching and fallback templates in the Node deployment', async () => {
    await execa('npx', ['modern', 'deploy', '--skip-build'], { cwd: appDir });
    const deployPort = await getPort();
    const deployment = await runContinuousTask(
      ['.output/index.js'],
      undefined,
      {
        cwd: appDir,
        env: { ...process.env, NODE_ENV: 'production', PORT: deployPort },
        waitMessage: /Server is listening on/i,
      },
    );
    try {
      await checkSsgResponses(deployPort, join(appDir, '.output'));
    } finally {
      await killApp(deployment);
    }
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

describe('SSG with an SSR entry fallback', () => {
  let app: any;
  let port: number;
  beforeAll(async () => {
    const build = await modernBuild(appDir, [
      '--config',
      'modern.ssr.config.ts',
    ]);
    expect(build.code).toBe(0);
    await execa(
      'npx',
      ['modern', 'deploy', '--skip-build', '--config', 'modern.ssr.config.ts'],
      { cwd: appDir },
    );
    port = await getPort();
    app = await runContinuousTask(['.output/index.js'], undefined, {
      cwd: appDir,
      env: { ...process.env, NODE_ENV: 'production', PORT: port },
      waitMessage: /Server is listening on/i,
    });
  });
  afterAll(async () => {
    await killApp(app);
  });

  test('renders unknown and skipped paths through SSR with the loader status', async () => {
    for (const pathname of ['/blog/scheduled', '/blog/does-not-exist']) {
      const response = await fetch(`http://localhost:${port}${pathname}`);
      expect(response.status).toBe(404);
      expect(await response.text()).not.toContain('BLOG LIST PAGE');
    }
    const response = await fetch(`http://localhost:${port}/blog/hello`);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('Hello world');
    expect(
      fs.existsSync(
        join(appDir, '.output/html/index/blog/scheduled/index.html'),
      ),
    ).toBe(false);
  });
});
