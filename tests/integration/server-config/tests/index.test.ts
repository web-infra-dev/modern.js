import dns from 'node:dns';
import path from 'path';
import {
  getPort,
  killApp,
  launchApp,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

dns.setDefaultResultOrder('ipv4first');

const supportServerRenderMiddleware = async ({
  host,
  port,
}: {
  host: string;
  port: number;
}) => {
  const res = await fetch(`${host}:${port}/`);
  expect(res.status).toBe(200);

  const { headers } = res;
  expect(headers.get('Server-Timing')).toMatch('render');
};

const supportServerRedirect = async ({
  host,
  port,
}: {
  host: string;
  port: number;
}) => {
  const res = await fetch(`${host}:${port}/?auth=1`, {
    redirect: 'manual',
  });
  expect(res.status).toBe(302);
  expect(res.headers.get('Location')).toBe('/login');
};

const supportServerMiddleware = async ({
  host,
  port,
}: {
  host: string;
  port: number;
}) => {
  const res = await fetch(`${host}:${port}/`);
  expect(res.status).toBe(200);

  const { headers } = res;
  expect(headers.get('X-Middleware')).toMatch('request');
  expect(headers.get('x-message')).toMatch('hi');
};

const supportServerPlugin = async ({
  host,
  port,
}: {
  host: string;
  port: number;
}) => {
  const res = await fetch(`${host}:${port}/`);
  expect(res.status).toBe(200);

  const { headers } = res;
  const text = await res.text();
  expect(text).toMatch('<body> <h3>bytedance</h3>');
  expect(headers.get('x-plugin-render-middleware')).toMatch('plugin');
};

describe('server config', () => {
  describe('dev', () => {
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

    test('renderMiddleware should works', async () => {
      await supportServerRenderMiddleware({
        host,
        port,
      });
    });

    test('redirect should works', async () => {
      await supportServerRedirect({
        host,
        port,
      });
    });

    test('middleware should works', async () => {
      await supportServerMiddleware({
        host,
        port,
      });
    });

    test('plugin should works', async () => {
      await supportServerPlugin({
        host,
        port,
      });
    });

    afterAll(async () => {
      await killApp(app);
    });
  });

  describe('prod', () => {
    let port = 8080;
    const host = `http://localhost`;
    const appPath = path.resolve(__dirname, '../');
    let app: any;

    beforeAll(async () => {
      port = await getPort();

      await modernBuild(appPath, [], {
        cwd: appPath,
      });

      app = await modernServe(appPath, port, {
        cwd: appPath,
      });
    });

    test('renderMiddleware should works', async () => {
      await supportServerRenderMiddleware({
        host,
        port,
      });
    });

    test('redirect should works', async () => {
      await supportServerRedirect({
        host,
        port,
      });
    });

    test('middleware should works', async () => {
      await supportServerMiddleware({
        host,
        port,
      });
    });

    test('plugin should works', async () => {
      await supportServerPlugin({
        host,
        port,
      });
    });

    afterAll(async () => {
      await killApp(app);
    });
  });
});
