import path from 'path';
import { readFileSync } from 'fs';
import { launchApp, killApp } from '../../../utils/modernTestUtils';

const fixtures = path.resolve(__dirname, '../fixtures');

describe('asset prefix', () => {
  it(`should generate assetPrefix correctly when dev.assetPrefix is true`, async () => {
    const appDir = path.resolve(fixtures, 'dev-asset-prefix');

    const app = await launchApp(appDir);

    const HTML = readFileSync(
      path.join(appDir, 'dist/html/main/index.html'),
      'utf-8',
    );
    expect(HTML.includes('//localhost:3333/static/js/')).toBeTruthy();

    killApp(app);
  });
});
