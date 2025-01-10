import path, { join } from 'path';
import { fs } from '@modern-js/utils';
import { modernBuild } from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

jest.setTimeout(1000 * 60 * 2);

it('should render static mega list routes', async () => {
  const appDir = join(fixtureDir, 'mega-list-routes');
  await modernBuild(appDir);

  const ids = [0, 100, 9999];
  for (const id of ids) {
    const htmlPath = path.join(appDir, `dist/html/main/user/${id}/index.html`);
    const content = fs.readFileSync(htmlPath, 'utf-8');
    expect(content).toContain(
      `<div class="text-center" id="data">/user/${id}</div>`,
    );
  }
});
