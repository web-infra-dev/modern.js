import path, { join } from 'path';
import { isVersionAtLeast18 } from '@modern-js/utils';
import {
  getPort,
  killApp,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

jest.setTimeout(1000 * 60);

describe('RSC serve HTML closing tags', () => {
  let app: any;
  let appPort: number;

  beforeAll(async () => {
    if (!isVersionAtLeast18()) {
      return;
    }

    const appDir = join(fixtureDir, 'rsc-closing-tags');
    appPort = await getPort();
    await modernBuild(appDir);
    app = await modernServe(appDir, appPort, {
      cwd: appDir,
    });
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
  });

  test('modern serve should return complete html with body and html closing tags', async () => {
    if (!isVersionAtLeast18()) {
      expect(true).toBe(true);
      return;
    }

    const res = await fetch(`http://127.0.0.1:${appPort}`);
    const html = await res.text();
    console.error(html);

    expect(html).toContain('RSC Closing Tags Fixture');
    expect(html).toContain('</body>');
    expect(html).toContain('</html>');
  });
});
