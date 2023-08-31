import http, { OutgoingHttpHeaders } from 'http';
import path from 'path';
import { fs } from '@modern-js/utils';
import { launchApp, getPort, killApp } from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

async function request(
  url: string,
  options?: { timeout?: number },
): Promise<{
  body: string;
  headers: OutgoingHttpHeaders;
}> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // eslint-disable-next-line prefer-promise-reject-errors
      reject(`timeout: ${options?.timeout || 3000}`);
    }, options?.timeout || 3000);
    const req = http.request(url, res => {
      res.on('error', reject);
      let data = '';
      res.on('data', chunk => {
        data += chunk.toString();
      });
      res.on('end', () => {
        resolve({
          headers: res.headers,
          body: data,
        });
      });
    });

    req.end();
  });
}

describe('SSR use loader', () => {
  let app: any;
  let appPort: number;
  const appDir = path.join(fixtureDir, 'useLoader');

  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(appDir, appPort);
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
  });

  test(`should content `, async () => {
    const url = `http://127.0.0.1:${appPort}`;
    const { body } = await request(url);

    expect(body).toMatch('Hello-Edenx');
  });

  test('should set routes.json hasUseLoader is true', async () => {
    const routePath = path.resolve(appDir, 'dist', 'route.json');

    const content = JSON.parse(fs.readFileSync(routePath, 'utf-8'));

    expect(content.hasUseLoader).toBeTruthy();
  });
});
