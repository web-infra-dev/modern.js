import fs from 'fs';
import path from 'path';
import { modernBuild } from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

function existsSync(filePath: string) {
  return fs.existsSync(path.join(appDir, 'dist', filePath));
}

test('should generate es5 artifact and pass check syntax by default', async () => {
  const appDir = path.resolve(__dirname, '..');
  await modernBuild(appDir);
  expect(existsSync('html/index/index.html')).toBeTruthy();
  expect(existsSync('static/js/index.js')).toBeTruthy();
});
