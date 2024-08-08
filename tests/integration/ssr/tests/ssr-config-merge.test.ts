import http, { OutgoingHttpHeaders } from 'http';
import path from 'path';
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

describe('SSR Config should be merged', () => {
  let app: any;
  let appPort: number;
  const appDir = path.join(fixtureDir, 'ssr-config-merge');

  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(appDir, appPort);
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
  });

  test(`should merge ssr config correctly`, async () => {
    const url = `http://127.0.0.1:${appPort}`;
    const { body } = await request(url);

    expect(body).toMatch('stream');
    expect(body).toMatch('host');
  });
});
