import path from 'path';
import fs from 'fs-extra';
import {
  createIsolatedTestApp,
  getPort,
  killApp,
  launchApp,
  sleep,
} from '../../../utils/modernTestUtils';

const sourceAppDir = path.resolve(__dirname, '../');

// This fixture does not install ts-node, so the server files go through the
// built-in TypeScript runtime.
describe('server runtime reload without ts-node', () => {
  let app: unknown;
  let appPort: number;
  let appDir: string;
  let cleanup: () => Promise<void>;

  const getReloadHeader = async () => {
    const res = await fetch(`http://localhost:${appPort}/`);
    return res.headers.get('x-server-reload');
  };

  beforeAll(async () => {
    // The default `.isolated-*` prefix would put the copy under a dot
    // directory, which the dev server's dependency tree ignores.
    ({ appDir, cleanup } = await createIsolatedTestApp(sourceAppDir, {
      prefix: 'isolated-dev-server-reload-',
    }));
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {}, {});
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
    await cleanup?.();
  });

  test('should load the server config and reload its imported files', async () => {
    expect(await getReloadHeader()).toBe('v1');

    const sharedFile = path.join(appDir, 'shared/serverReload.ts');
    const content = await fs.readFile(sharedFile, 'utf-8');
    await fs.writeFile(sharedFile, content.replace("'v1'", "'v2'"));

    let header: string | null = null;
    for (let i = 0; i < 40 && header !== 'v2'; i++) {
      await sleep(250);
      header = await getReloadHeader();
    }
    expect(header).toBe('v2');
  });
});
