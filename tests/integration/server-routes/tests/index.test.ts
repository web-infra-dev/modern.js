import path from 'path';
import axios from 'axios';
import {
  modernBuild,
  modernServe,
  getPort,
  killApp,
} from '../../../utils/modernTestUtils';

const appPath = path.resolve(__dirname, '../');
const successStatus = 200;
let app: any;
let appPort: number;

beforeAll(async () => {
  await modernBuild(appPath);
  appPort = await getPort();
});

afterAll(async () => {
  if (app) {
    await killApp(app);
  }
});

describe('test basic usage', () => {
  test(`should start successfully`, async () => {
    app = await modernServe(appPath, appPort);
    expect(app.pid).toBeDefined();

    const { status } = await axios.get(`http://localhost:${appPort}/a`);
    expect(status).toBe(successStatus);

    const { status: aStatus } = await axios.get(
      `http://localhost:${appPort}/b`,
    );
    expect(aStatus).toBe(successStatus);
  });

  test(`should inject server data correctly`, async () => {
    const response = await axios.get(`http://localhost:${appPort}/main/abc`);

    const body = response.data;
    expect(body).toMatch(/abc/);
  });

  test('should inject server data safety', async () => {
    const response = await axios.get(
      `http://localhost:${appPort}/main/dlwlrma<%2fscript%20x><script%20x>alert(1)%2f%2f`,
    );

    const body = response.data;

    expect(body).not.toMatch(`dlwlrma</script`);
  });
});
