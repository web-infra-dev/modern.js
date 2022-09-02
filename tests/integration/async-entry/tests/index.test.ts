import path from 'path';
import { readFileSync } from 'fs';
import { modernBuild } from '../../../utils/modernTestUtils';

describe('generate async entry', () => {
  it(`should generate async entry correctly`, async () => {
    const appDir = path.resolve(__dirname, '..');

    await modernBuild(appDir);

    expect(
      readFileSync(
        path.resolve(appDir, `node_modules/.modern-js/main/bootstrap.js`),
        'utf8',
      ),
    ).toContain(`import App from '@_modern_js_src/App';`);

    expect(
      readFileSync(
        path.resolve(appDir, `node_modules/.modern-js/main/index.js`),
        'utf8',
      ),
    ).toContain(`import('./bootstrap.js');`);
  });
});
