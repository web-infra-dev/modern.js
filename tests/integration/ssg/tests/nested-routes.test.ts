import path, { join } from 'path';
import { fs } from '@modern-js/utils';
import { modernBuild, killApp } from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

jest.setTimeout(1000 * 60 * 3);

describe('ssg', () => {
  let app: any;
  let appDir: string;
  let distDir: string;
  beforeAll(async () => {
    appDir = join(fixtureDir, 'nested-routes');
    distDir = join(appDir, './dist');
    await modernBuild(appDir);
  });
  afterAll(async () => {
    await killApp(app);
  });

  test('should nested-routes ssg access / work correctly', async () => {
    const htmlPath = path.join(distDir, 'html/main/index.html');
    const html = (await fs.readFile(htmlPath)).toString();
    expect(html.includes('Hello, Home')).toBe(true);
  });

  test('should nested-routes ssg access /user work correctly', async () => {
    const htmlPath = path.join(distDir, 'html/main/user/index.html');
    const html = (await fs.readFile(htmlPath)).toString();
    expect(html.includes('Hello, User')).toBe(true);
  });
});
