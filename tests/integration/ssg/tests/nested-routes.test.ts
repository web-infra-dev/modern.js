import os from 'node:os';
import path, { join } from 'path';
import { fs } from '@modern-js/utils';
import puppeteer from 'puppeteer';
import {
  getPort,
  killApp,
  launchOptions,
  modernBuild,
  modernServe,
  runModernCommandDev,
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

  test('skips HTML output and route registration for loader 404 responses', async () => {
    expect(
      fs.existsSync(join(distDir, 'html/index/user/missing/index.html')),
    ).toBe(false);
    const { routes } = await fs.readJSON(join(distDir, 'route.json'));
    expect(routes).not.toContainEqual(
      expect.objectContaining({ urlPath: '/user/missing' }),
    );
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

describe('route-level ssgParams', () => {
  const paramsDistDir = join(appDir, 'dist-ssg');
  let temporaryDir: string;
  let callsFile: string;

  beforeAll(async () => {
    temporaryDir = await fs.mkdtemp(join(os.tmpdir(), 'modern-ssg-params-'));
    callsFile = join(temporaryDir, 'calls.txt');
  });

  afterAll(async () => {
    await fs.remove(temporaryDir);
  });

  const buildParams = async (scenario: string) => {
    await fs.remove(callsFile);
    return modernBuild(appDir, ['--config', 'modern.params.config.ts'], {
      env: {
        SSG_PARAMS_SCENARIO: scenario,
        SSG_PARAMS_CALLS: callsFile,
      },
    });
  };

  test('prerenders generated params with the compiled loaders and keeps server dependencies out of the browser', async () => {
    const result = await buildParams('automatic');
    expect(result.code, result.stdout + result.stderr).toBe(0);
    const { routes } = await fs.readJSON(join(paramsDistDir, 'route.json'));
    const generated = routes.filter(
      (route: { isSSG?: boolean }) => route.isSSG,
    );
    const encodedSlug = encodeURIComponent('你好 world?#%');
    const expectedPages = [
      ['/prefix', '<main>Static home</main>'],
      ['/prefix/blog/en/hello', '<main>en: hello</main>'],
      ['/prefix/blog/en/%2A', '<main>en: *</main>'],
      ['/prefix/blog/en/release.v1', '<main>en: release.v1</main>'],
      [`/prefix/blog/zh/${encodedSlug}`, '<main>zh: 你好 world?#%</main>'],
      ['/prefix/blog/en/a%2Fb', '<main>en: a/b</main>'],
      ['/prefix/optional', 'Category: <!-- -->all'],
      ['/prefix/optional/news', 'Category: <!-- -->news'],
      [
        '/prefix/files/guides/hello%20world',
        'File: <!-- -->guides/hello world',
      ],
    ];
    expect(generated).toHaveLength(expectedPages.length);
    for (const [url, content] of expectedPages) {
      const matches = generated.filter(
        (route: { urlPath: string }) => route.urlPath === url,
      );
      expect(matches, url).toHaveLength(1);
      const html = await fs.readFile(
        join(paramsDistDir, matches[0].entryPath),
        'utf8',
      );
      expect(html, url).toContain(content);
      expect(matches[0].entryPath, url).toMatch(/\/index\.html$/);
    }
    expect(
      generated.some(
        (route: { urlPath: string }) =>
          route.urlPath.includes('/empty/') ||
          route.urlPath.includes('/excluded') ||
          route.urlPath.includes('/scheduled'),
      ),
    ).toBe(false);
    expect(await fs.readFile(callsFile, 'utf8')).toBe(
      'SSG_PARAMS_SERVER_ONLY\n',
    );

    const readJavaScript = async (directory: string): Promise<string[]> => {
      const contents = await Promise.all(
        (await fs.readdir(directory, { withFileTypes: true })).map(
          async entry => {
            const filename = join(directory, entry.name);
            if (entry.isDirectory()) {
              return readJavaScript(filename);
            }
            return entry.name.endsWith('.js')
              ? [await fs.readFile(filename, 'utf8')]
              : [];
          },
        ),
      );
      return contents.flat();
    };
    const browserJavaScript = await readJavaScript(
      join(paramsDistDir, 'static'),
    );
    expect(browserJavaScript.length).toBeGreaterThan(0);
    expect(browserJavaScript.join('\n')).not.toContain(
      'SSG_PARAMS_SERVER_ONLY',
    );
    expect(browserJavaScript.join('\n')).not.toContain('node:fs');

    const port = await getPort();
    const app = await runModernCommandDev(
      ['serve', '--config', 'modern.params.config.ts'],
      undefined,
      {
        cwd: appDir,
        modernServe: true,
        env: {
          NODE_ENV: 'production',
          PORT: port,
          SSG_PARAMS_SCENARIO: 'automatic',
          SSG_PARAMS_CALLS: callsFile,
        },
      },
    );
    try {
      for (const [url, content] of expectedPages) {
        const response = await fetch(`http://localhost:${port}${url}`);
        expect(response.status, url).toBe(200);
        expect(await response.text(), url).toContain(content);
      }
      for (const url of [
        '/prefix/blog/en/not-generated',
        '/prefix/blog/en/*/child',
        '/prefix/files/guides/missing',
      ]) {
        const response = await fetch(`http://localhost:${port}${url}`);
        expect(response.status, url).toBe(404);
      }
    } finally {
      await killApp(app);
    }
    expect(await fs.readFile(callsFile, 'utf8')).toBe(
      'SSG_PARAMS_SERVER_ONLY\n',
    );
  });

  test('explicit routes remain authoritative and do not call parameter generators', async () => {
    const result = await buildParams('explicit');
    expect(result.code, result.stdout + result.stderr).toBe(0);
    expect(await fs.pathExists(callsFile)).toBe(false);
    const { routes } = await fs.readJSON(join(paramsDistDir, 'route.json'));
    const generated = routes.filter(
      (route: { isSSG?: boolean }) => route.isSSG,
    );
    expect(
      generated.map((route: { urlPath: string }) => route.urlPath),
    ).toEqual(['/prefix/blog/en/explicit']);
    expect(
      await fs.readFile(join(paramsDistDir, generated[0].entryPath), 'utf8'),
    ).toContain('<main>Explicit route</main>');
  });

  test('disabling SSG does not execute parameter generators', async () => {
    const result = await buildParams('disabled');
    expect(result.code, result.stdout + result.stderr).toBe(0);
    expect(await fs.pathExists(callsFile)).toBe(false);
    const { routes } = await fs.readJSON(join(paramsDistDir, 'route.json'));
    expect(routes.some((route: { isSSG?: boolean }) => route.isSSG)).toBe(
      false,
    );
  });

  test.each(['invalid', 'throws'])(
    'fails the build for %s parameter generators',
    async scenario => {
      const result = await buildParams(scenario);
      expect(result.code).not.toBe(0);
      expect(result.stdout + result.stderr).toContain('ssgParams');
      expect(result.stdout + result.stderr).toContain('blog');
      if (scenario === 'throws') {
        expect(result.stdout + result.stderr).toContain(
          'CMS unavailable during ssgParams',
        );
      }
    },
  );
});
