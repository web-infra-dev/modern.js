import path from 'path';
import { fs } from '@modern-js/utils';
import {
  getPort,
  launchApp,
  killApp,
  modernBuild,
  modernStart,
} from '../../../utils/modernTestUtils';
import 'isomorphic-fetch';

const supportServerConfig = async ({
  host,
  port,
  prefix,
}: {
  host: string;
  port: number;
  prefix: string;
}) => {
  const res = await fetch(`${host}:${port}${prefix}/proxy`);
  expect(res.status).toBe(200);
  const text = await res.text();
  expect(text).toBe('foo');
};

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

const supportConfigHook = async ({
  host,
  port,
  prefix,
}: {
  host: string;
  port: number;
  prefix: string;
}) => {
  const res = await fetch(`${host}:${port}${prefix}/bar`);
  expect(res.status).toBe(200);
  const text = await res.text();
  expect(text).toBe('foo');
};

describe('server config in dev', () => {
  let port = 8080;
  const prefix = '/api';
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

  test('server config should works', () =>
    supportServerConfig({
      host,
      port,
      prefix,
    }));

  test('plugins should works', () =>
    supportServerPlugins({
      host,
      port,
    }));

  test('support config hooks', () =>
    supportConfigHook({
      host,
      port,
      prefix,
    }));

  afterAll(async () => {
    await killApp(app);
  });
});

describe('server config in prod', () => {
  let port = 8080;
  const prefix = '/api';
  const host = `http://localhost`;
  const appPath = path.resolve(__dirname, '../');
  let app: any;

  beforeAll(async () => {
    port = await getPort();

    await modernBuild(appPath, [], {
      cwd: appPath,
    });

    await fs.ensureDir(path.resolve(__dirname, '../dist/api'));

    app = await modernStart(appPath, port, {
      cwd: appPath,
    });
  });

  test('server config should works', () =>
    supportServerConfig({
      host,
      port,
      prefix,
    }));

  test('plugins should works', async () => {
    await supportServerPlugins({
      host,
      port,
    });
  });

  test('support config hooks', () =>
    supportConfigHook({
      host,
      port,
      prefix,
    }));

  afterAll(async () => {
    await killApp(app);
  });
});
