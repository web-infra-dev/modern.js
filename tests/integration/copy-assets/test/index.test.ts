import path from 'path';
import { readFileSync } from 'fs';
import { modernBuild } from '../../../utils/modernTestUtils';

const fixtures = path.resolve(__dirname, '../fixtures');

async function testPublicHtml(bundler: 'rspack' | 'webpack') {
  const appDir = path.resolve(fixtures, 'copy-public-html');

  await modernBuild(appDir, undefined, { env: { BUNDLER: bundler } });

  const copiedHTML = readFileSync(
    path.join(appDir, `dist/${bundler}/public/demo.html`),
    'utf-8',
  );
  expect(copiedHTML).toMatchSnapshot();
}

describe('copy assets', () => {
  it(`should copy public html and replace the assetPrefix variable in webpack`, async () => {
    await testPublicHtml('webpack');
  });

  it(`should copy public html and replace the assetPrefix variable in rspack`, async () => {
    await testPublicHtml('rspack');
  });
});
