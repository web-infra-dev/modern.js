import path from 'path';
import { readFileSync } from 'fs';
import { modernBuild } from '../../../utils/modernTestUtils';

describe('custom template', () => {
  it(`should allow to custom template by html.template option`, async () => {
    const appDir = path.resolve(__dirname, '..');

    await modernBuild(appDir);

    expect(
      readFileSync(path.resolve(appDir, `dist/html/main/index.html`), 'utf8'),
    ).toMatchSnapshot();
  });
});
