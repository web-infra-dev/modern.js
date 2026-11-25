import os from 'node:os';
import path from 'path';
import fs from 'fs-extra';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  createIsolatedTestApp,
  getPort,
  killApp,
  launchApp,
  launchOptions,
  sleep,
} from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

test.each(['default', 'relative', 'absolute'])(
  'should load, reload and disable TypeScript HTTP mocks in a %s directory',
  async directory => {
    const isolated = await createIsolatedTestApp(appDir, {
      prefix: 'isolated-dev-server-mock-',
    });
    let app: unknown;
    let externalMockDir: string | undefined;
    try {
      let mockDir = path.join(isolated.appDir, 'config/mock');
      if (directory !== 'default') {
        externalMockDir = await fs.mkdtemp(
          path.join(os.tmpdir(), 'modern-mock-'),
        );
        mockDir = externalMockDir;
        const configuredDir =
          directory === 'relative'
            ? path.relative(isolated.appDir, mockDir)
            : mockDir;
        const configFile = path.join(isolated.appDir, 'modern.config.ts');
        const config = await fs.readFile(configFile, 'utf-8');
        await fs.writeFile(
          configFile,
          config.replace(
            '  dev: {\n    server: {',
            `  dev: {\n    mockDir: ${JSON.stringify(configuredDir)},\n    server: {`,
          ),
        );
      }
      const mockFile = path.join(mockDir, 'index.ts');
      const mockSource = `
const label: string = 'from-ts';
export const config = {
  enable: (req: { headers: Record<string, string> }) => req.headers['x-disable-mock'] !== '1',
};
export default {
  'GET /api/mock-info': { value: label },
  'POST /api/mock-info': { values: [1, 2, 3, 4] },
};
`;
      await fs.outputFile(mockFile, mockSource);
      const port = await getPort();
      app = await launchApp(isolated.appDir, port);
      const url = `http://localhost:${port}/api/mock-info`;
      const request = (method = 'GET', headers = {}) =>
        fetch(url, {
          method,
          headers: { Accept: 'application/json', ...headers },
          signal: AbortSignal.timeout(5000),
        });

      const getResponse = await request();
      expect(getResponse.status).toBe(200);
      expect(await getResponse.json()).toEqual({ value: 'from-ts' });
      const postResponse = await request('POST');
      expect(postResponse.status).toBe(200);
      expect(await postResponse.json()).toEqual({ values: [1, 2, 3, 4] });
      // Disabled mocks fall through to this app's HTML fallback, not a 404.
      const disabledResponse = await request('POST', { 'x-disable-mock': '1' });
      expect(disabledResponse.status).toBe(200);
      expect(disabledResponse.headers.get('content-type')).toContain(
        'text/html',
      );
      await disabledResponse.text();

      await fs.writeFile(
        mockFile,
        mockSource.replace("'from-ts'", "'updated-ts'"),
      );
      let value: string | undefined;
      for (let i = 0; i < 40 && value !== 'updated-ts'; i++) {
        await sleep(250);
        value = (await (await request()).json()).value;
      }
      expect(value).toBe('updated-ts');

      await fs.writeFile(
        mockFile,
        mockSource.replace(
          "(req: { headers: Record<string, string> }) => req.headers['x-disable-mock'] !== '1'",
          'false',
        ),
      );
      let contentType: string | null = null;
      for (let i = 0; i < 40 && !contentType?.includes('text/html'); i++) {
        await sleep(250);
        const response = await request('POST');
        expect(response.status).toBe(200);
        contentType = response.headers.get('content-type');
        await response.text();
      }
      expect(contentType).toContain('text/html');
      const disabledGetResponse = await request();
      expect(disabledGetResponse.status).toBe(200);
      expect(disabledGetResponse.headers.get('content-type')).toContain(
        'text/html',
      );
      await disabledGetResponse.text();
    } finally {
      try {
        if (app) {
          await killApp(app);
        }
      } finally {
        await isolated.cleanup();
        if (externalMockDir) {
          await fs.remove(externalMockDir);
        }
      }
    }
  },
);

describe('dev', () => {
  let app: unknown;
  let appPort: number;
  let page: Page;
  let browser: Browser;
  const errors: string[] = [];
  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {}, {});
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
    page.on('pageerror', error => {
      errors.push((error as Error).message);
    });
  });

  test('should return response header set in before correctly', async () => {
    const response = await page.goto(`http://localhost:${appPort}`);
    const headers = response!.headers();
    expect(headers['x-config']).toBe('test-config');
    expect(headers['x-plugin']).toBe('test-plugin');
    expect(headers['x-push-middleware']).toBe('test-middleware');
    expect(headers['x-unshift-middleware']).toBe('test-middleware');
  });

  test('should provide history api fallback correctly', async () => {
    await page.goto(`http://localhost:${appPort}`);
    expect(await page.content()).toContain('<div>home<div>');

    await page.goto(`http://localhost:${appPort}/a`);
    expect(await page.content()).toContain('<div>A</div>');

    await page.goto(`http://localhost:${appPort}/b`);
    expect(await page.content()).toContain('<div>B</div>');
  });

  test('should return correct CORS headers for OPTIONS request', async () => {
    // Create a new browser context to simulate cross-origin request
    const context = await browser.createBrowserContext();
    const corsPage = await context.newPage();

    // Set the origin header to simulate cross-origin request
    await corsPage.setExtraHTTPHeaders({
      Origin: 'http://example.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization',
    });

    const response = await corsPage.evaluate(url => {
      // Use Promise instead of async/await to avoid __awaiter issues
      return fetch(url, {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://example.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
        },
      }).then(res => {
        const headers: Record<string, string> = {};
        res.headers.forEach((value, key) => {
          headers[key] = value;
        });

        return {
          status: res.status,
          headers,
        };
      });
    }, `http://localhost:${appPort}`);

    // Check CORS preflight headers
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://example.com',
    );
    expect(response.headers['access-control-allow-methods']).toContain('POST');
    expect(response.headers['access-control-allow-headers']).toContain(
      'Content-Type',
    );

    await corsPage.close();
    await context.close();
  });

  test('should not return access-control-allow-origin header for OPTIONS request', async () => {
    // Create a new browser context to simulate cross-origin request
    const context = await browser.createBrowserContext();
    const corsPage = await context.newPage();

    // Set the origin header to simulate cross-origin request
    await corsPage.setExtraHTTPHeaders({
      Origin: 'http://modernjs.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization',
    });

    const response = await corsPage.evaluate(url => {
      // Use Promise instead of async/await to avoid __awaiter issues
      return fetch(url, {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://modernjs.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
        },
      }).then(res => {
        const headers: Record<string, string> = {};
        res.headers.forEach((value, key) => {
          headers[key] = value;
        });

        return {
          status: res.status,
          headers,
        };
      });
    }, `http://localhost:${appPort}`);

    // Check CORS preflight headers
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(response.headers['access-control-allow-methods']).toContain('POST');

    await corsPage.close();
    await context.close();
  });

  test('should apply dev.server.headers correctly', async () => {
    const response = await page.goto(`http://localhost:${appPort}`);
    const headers = response!.headers();
    expect(headers['x-server-header']).toBe('test-server-header');
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });
});
