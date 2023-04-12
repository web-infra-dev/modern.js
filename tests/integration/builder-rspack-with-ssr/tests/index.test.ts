import path from 'path';
import type { Page } from 'puppeteer';
import {
  launchApp,
  killApp,
  getPort,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';
import { supportSSR } from './supports';

declare const page: Page;

const appDir = path.resolve(__dirname, '../');

describe('dev', () => {
  let app: unknown;
  let appPort: number;
  const errors: string[] = [];
  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {}, {});
    page.on('pageerror', error => {
      errors.push(error.message);
    });
  });

  describe('support rspack with ssr', () => {
    test('should render by string', async () => {
      await supportSSR(errors, appPort, page);
    });
  });

  afterAll(async () => {
    await killApp(app);
  });
});

describe('build', () => {
  let appPort: number;
  let app: unknown;
  const errors: string[] = [];

  beforeAll(async () => {
    appPort = await getPort();
    await modernBuild(appDir);
    app = await modernServe(appDir, appPort, {
      cwd: appDir,
    });
    page.on('pageerror', error => {
      errors.push(error.message);
    });
  });

  describe('support rspack with ssr', () => {
    test('should render by string', async () => {
      await supportSSR(errors, appPort, page);
    });
  });

  afterAll(async () => {
    await killApp(app);
  });
});
