import path from 'path';
import { readFileSync } from 'fs';
import { modernBuild } from '../../../utils/modernTestUtils';

export async function testPublicHtml(bundler: 'rspack' | 'webpack') {
  const appDir = path.resolve(__dirname, '..');

  await modernBuild(appDir, undefined, { env: { BUNDLER: bundler } });

  const copiedHTML = readFileSync(
    path.join(appDir, `dist/${bundler}/public/demo.html`),
    'utf-8',
  );
  expect(copiedHTML).toMatchSnapshot();
}
