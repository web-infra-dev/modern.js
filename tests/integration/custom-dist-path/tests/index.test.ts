import path from 'path';
import { fs, OUTPUT_CONFIG_FILE } from '@modern-js/utils';
import { modernBuild } from '../../../utils/modernTestUtils';

test(`should allow distPath.root to be an absolute path`, async () => {
  const appDir = path.resolve(__dirname, '..');
  await modernBuild(appDir);

  const distPath = path.join(appDir, 'dist/foo');
  const configFile = path.join(distPath, OUTPUT_CONFIG_FILE);
  const htmlFile = path.join(distPath, 'html/main/index.html');
  expect(fs.existsSync(configFile)).toBeTruthy();
  expect(fs.existsSync(htmlFile)).toBeTruthy();
});
