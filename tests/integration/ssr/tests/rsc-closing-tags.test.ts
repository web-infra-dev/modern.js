import path, { join } from 'path';
import { isVersionAtLeast18 } from '@modern-js/utils';
import {
  getPort,
  killApp,
  launchApp,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

rstest.setConfig({ testTimeout: 1000 * 60, hookTimeout: 1000 * 60 });

const fixtureDir = path.resolve(__dirname, '../fixtures');

function expectFlightScriptsBeforeClosingTags(html: string) {
  const lastFlightScriptIndex = html.lastIndexOf(
    '<script>(self.__FLIGHT_DATA||=[]).push(',
  );
  const lastBodyClosingTagIndex = html.lastIndexOf('</body>');
  const lastHtmlClosingTagIndex = html.lastIndexOf('</html>');

  expect(lastFlightScriptIndex).toBeGreaterThan(-1);
  expect(lastBodyClosingTagIndex).toBeGreaterThan(-1);
  expect(lastHtmlClosingTagIndex).toBeGreaterThan(-1);
  expect(lastFlightScriptIndex).toBeLessThan(lastBodyClosingTagIndex);
  expect(lastFlightScriptIndex).toBeLessThan(lastHtmlClosingTagIndex);
}

describe('RSC serve HTML closing tags', () => {
  let app: any;
  let appPort: number;

  beforeAll(async () => {
    if (!isVersionAtLeast18()) {
      return;
    }

    const appDir = join(fixtureDir, 'rsc-closing-tags');
    appPort = await getPort();
    const buildRes = await modernBuild(appDir);
    expect(buildRes.code === 0).toBe(true);
    app = await modernServe(appDir, appPort, {
      cwd: appDir,
    });
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
  });

  test('modern serve should end the response with body and html closing tags', async () => {
    if (!isVersionAtLeast18()) {
      expect(true).toBe(true);
      return;
    }

    const res = await fetch(`http://127.0.0.1:${appPort}`);
    const html = await res.text();

    expect(res.status).toBe(200);
    expect((html.match(/<\/body>/g) || []).length).toBe(1);
    expect((html.match(/<\/html>/g) || []).length).toBe(1);
    expect(html.trimEnd().endsWith('</html>')).toBe(true);
    expectFlightScriptsBeforeClosingTags(html);
  });
});

describe('RSC dev HTML closing tags', () => {
  let app: any;
  let appPort: number;

  beforeAll(async () => {
    if (!isVersionAtLeast18()) {
      return;
    }

    const appDir = join(fixtureDir, 'rsc-closing-tags');
    appPort = await getPort();
    app = await launchApp(appDir, appPort);
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
  });

  test('modern dev should not duplicate body and html closing tags', async () => {
    if (!isVersionAtLeast18()) {
      expect(true).toBe(true);
      return;
    }

    const res = await fetch(`http://127.0.0.1:${appPort}`);
    const html = await res.text();

    expect(res.status).toBe(200);
    expect((html.match(/<\/body>/g) || []).length).toBe(1);
    expect((html.match(/<\/html>/g) || []).length).toBe(1);
    expect(html.trimEnd().endsWith('</html>')).toBe(true);
    expectFlightScriptsBeforeClosingTags(html);
  });
});
