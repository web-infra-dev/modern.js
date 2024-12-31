import dns from 'node:dns';
import path from 'path';
import {
  getPort,
  killApp,
  launchApp,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';
import 'isomorphic-fetch';

dns.setDefaultResultOrder('ipv4first');

const appDir = path.resolve(__dirname, '../');

const testApiWorked = async ({
  host,
  port,
  prefix,
}: {
  host: string;
  port: number;
  prefix: string;
}) => {
  const expectedText = 'Hello get bff-api-app';
  const res = await fetch(`${host}:${port}${prefix}`);
  expect(res.status).toBe(200);
  const text = await res.text();
  expect(text).toBe(JSON.stringify({ message: expectedText }));
};

describe('bff api-app in dev', () => {
  let port = 8080;
  const host = `http://localhost`;
  const prefix = '/api-app';
  let app: any;

  beforeAll(async () => {
    jest.setTimeout(1000 * 60 * 2);
    port = await getPort();
    app = await launchApp(appDir, port, {});
  });

  test('api-app should works', async () => {
    await testApiWorked({
      host,
      port,
      prefix,
    });
  });

  afterAll(async () => {
    await killApp(app);
  });
});

describe('bff api-app in prod', () => {
  let port = 8080;
  const host = `http://localhost`;
  const prefix = '/api-app';
  let app: any;

  beforeAll(async () => {
    port = await getPort();

    await modernBuild(appDir, [], {});

    app = await modernServe(appDir, port, {});
  });

  test('api-app should works', async () => {
    await testApiWorked({
      host,
      port,
      prefix,
    });
  });

  afterAll(async () => {
    await killApp(app);
  });
});
