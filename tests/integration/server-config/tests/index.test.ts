import dns from 'node:dns';
import path from 'path';
import { fs } from '@modern-js/utils';
import {
  getPort,
  launchApp,
  killApp,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';
import 'isomorphic-fetch';

dns.setDefaultResultOrder('ipv4first');

const supportServerPlugins = async ({
  host,
  port,
}: {
  host: string;
  port: number;
}) => {
  const expectedText = 'Hello Modernjs';
  const res = await fetch(`${host}:${port}/api`);
  expect(res.status).toBe(200);
  const text = await res.text();
  expect(text).toBe(expectedText);
};

describe.skip('server config in dev', () => {
  let port = 8080;
  const host = `http://localhost`;
  const appPath = path.resolve(__dirname, '../');
  let app: any;

  beforeAll(async () => {
    jest.setTimeout(1000 * 60 * 2);
    port = await getPort();
    app = await launchApp(appPath, port, {
      cwd: appPath,
    });
  });

  test('plugins should works', async () => {
    // await new Promise(resolve => setTimeout(resolve, 1000));
    await supportServerPlugins({
      host,
      port,
    });
  });

  afterAll(async () => {
    await killApp(app);
  });
});

describe.skip('server config in prod', () => {
  let port = 8080;
  const host = `http://localhost`;
  const appPath = path.resolve(__dirname, '../');
  let app: any;

  beforeAll(async () => {
    port = await getPort();

    await modernBuild(appPath, [], {
      cwd: appPath,
    });

    await fs.ensureDir(path.resolve(__dirname, '../dist/api'));

    app = await modernServe(appPath, port, {
      cwd: appPath,
    });
  });

  test('plugins should works', async () => {
    await supportServerPlugins({
      host,
      port,
    });
  });

  afterAll(async () => {
    await killApp(app);
  });
});
