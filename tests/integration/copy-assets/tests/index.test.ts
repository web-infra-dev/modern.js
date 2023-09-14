import path from 'path';
import { readFileSync } from 'fs';
import { modernBuild } from '../../../utils/modernTestUtils';

export async function testPublicHtml() {
  const appDir = path.resolve(__dirname, '..');

  await modernBuild(appDir, undefined);

  const copiedHTML = readFileSync(
    path.join(appDir, `dist/public/demo.html`),
    'utf-8',
  );
  expect(copiedHTML).toMatchSnapshot();
}

describe('copy assets', () => {
  test(`should copy public html and replace the assetPrefix variable in rspack`, async () => {
    await testPublicHtml();
  });
});
