import path from 'path';
import { existsSync } from 'fs';
import { modernBuild } from '../../../utils/modernTestUtils';

test(`should not generate html files when tools.htmlPlugin is false`, async () => {
  const appDir = path.resolve(__dirname, '..');

  await modernBuild(appDir);

  expect(
    existsSync(path.resolve(appDir, `dist/html/main/index.html`)),
  ).toBeFalsy();
});
