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

describe('SSR preload', () => {
  let app: any;
  let appPort: number;

  beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'preload');
    appPort = await getPort();
    app = await launchApp(appDir, appPort);
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
  });

  test(`should add Links to response headers`, async () => {
    const url = `http://localhost:${appPort}`;
    const { headers, body } = await request(url);

    expect(headers.link).toMatchSnapshot();
    expect(body).toMatch('"renderLevel":2');
  });
});
