import dns from 'node:dns';
import path from 'path';
import {
  getPort,
  launchApp,
  killApp,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';
import 'isomorphic-fetch';

dns.setDefaultResultOrder('ipv4first');
describe('api-service in dev', () => {
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

  test('support get method', async () => {
    const res = await fetch(`${host}:${port}${prefix}`);
    const data = await res.json();
    expect(data).toEqual({
      message: 'Hello Modern.js',
    });
  });

  test('support post method', async () => {
    const res = await fetch(`${host}:${port}${prefix}`, {
      method: 'POST',
    });
    const data = await res.json();
    expect(data).toEqual({
      message: 'Hello Modern.js',
    });
  });

  test('support useContext', async () => {
    const res = await fetch(`${host}:${port}${prefix}/context`);
    const info = await res.json();
    expect(res.headers.get('x-id')).toBe('1');
    expect(info.message).toBe('Hello Modern.js');
  });

  afterAll(async () => {
    await killApp(app);
  });
});

describe('api-service in prod', () => {
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

    app = await modernServe(appPath, port, {
      cwd: appPath,
    });
  });

  test('support get method', async () => {
    const res = await fetch(`${host}:${port}${prefix}`);
    const data = await res.json();
    expect(data).toEqual({
      message: 'Hello Modern.js',
    });
  });

  test('support post method', async () => {
    const res = await fetch(`${host}:${port}${prefix}`, {
      method: 'POST',
    });
    const data = await res.json();
    expect(data).toEqual({
      message: 'Hello Modern.js',
    });
  });

  test('support useContext', async () => {
    const res = await fetch(`${host}:${port}${prefix}/context`);
    const info = await res.json();
    expect(res.headers.get('x-id')).toBe('1');
    expect(info.message).toBe('Hello Modern.js');
  });

  afterAll(async () => {
    await killApp(app);
  });
});
