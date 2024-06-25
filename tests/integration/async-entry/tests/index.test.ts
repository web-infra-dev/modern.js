import path from 'path';
import { readFileSync } from 'fs';
import { modernBuild } from '../../../utils/modernTestUtils';

describe('generate async entry', () => {
  test(`should generate async entry correctly`, async () => {
    const appDir = path.resolve(__dirname, '..');

    await modernBuild(appDir);

    expect(
      readFileSync(
        path.resolve(appDir, `node_modules/.modern-js/main/bootstrap.jsx`),
        'utf8',
      ),
    ).toContain(`import App from '@_modern_js_src/App.tsx';`);

    expect(
      readFileSync(
        path.resolve(appDir, `node_modules/.modern-js/main/index.jsx`),
        'utf8',
      ),
    ).toContain(`import('./bootstrap.jsx');`);
  });
});
