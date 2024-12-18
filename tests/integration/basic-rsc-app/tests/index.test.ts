import fs from 'fs';
import path from 'path';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

describe('test basic rsc app', () => {
  let app: any;
  let appPort: number;
  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(
      appDir,
      appPort,
      {},
      {
        BUNDLER: 'webpack',
      },
    );
  });

  afterAll(async () => {
    await killApp(app);
  });

  describe('test client component root', () => {
    const baseUrl = `client-component-root`;
    it('should render page correctly', async () => {
      let res;
      try {
        res = await fetch(`http://127.0.0.1:${appPort}/${baseUrl}`);
      } catch (error) {
        console.log('error', error);
        throw error;
      }

      const pageText = await res.text();

      expect(pageText?.trim()).toContain('Get started by editing');
    });
  });

  describe('test server component root', () => {
    const baseUrl = `server-component-root`;
    it('should render page correctly', async () => {
      let res;
      try {
        res = await fetch(`http://127.0.0.1:${appPort}/${baseUrl}`);
      } catch (error) {
        console.log('error', error);
        throw error;
      }

      const pageText = await res.text();

      expect(pageText?.trim()).toContain('Get started by editing');
    });
  });
});
