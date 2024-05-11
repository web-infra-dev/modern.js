import path from 'path';
import axios from 'axios';
import { launchApp, getPort, killApp } from '../../../../utils/modernTestUtils';

const appPath = path.resolve(__dirname, '../');

describe('test new middleware run correctly', () => {
  let app: any;
  let port: number;
  beforeAll(async () => {
    jest.setTimeout(1000 * 60 * 2);

    port = await getPort();

    app = await launchApp(appPath, port);
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
  });

  test('should request "/" correctly', async () => {
    const url = `http://localhost:${port}`;
    const res = await axios.get(url);

    const { headers, data: body } = res;

    expect(body).toMatch('Liming');

    expect(headers).toHaveProperty('server-timing');

    expect(body).toMatch(/lang="en"/);

    expect(headers).toHaveProperty('x-custom-value', 'modern');
  });

  test('should redirect corretly', async () => {
    const url = `http://localhost:${port}/?unlogin=1`;
    const res = await axios.get(url);

    const { data: body, headers } = res;

    expect(body).toMatch('Login');

    expect(body).toMatch(/lang="en"/);

    expect(headers).toHaveProperty('x-custom-value', 'modern');
  });
});
