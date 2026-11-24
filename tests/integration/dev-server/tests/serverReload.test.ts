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
    // ESM-only packages that require() can't load, created in this copy only.
    const writePackage = async (
      name: string,
      pkg: Record<string, unknown>,
      code: string,
    ) => {
      const dir = path.join(appDir, 'node_modules', name);
      await fs.outputJSON(path.join(dir, 'package.json'), {
        name,
        type: 'module',
        ...pkg,
      });
      await fs.outputFile(path.join(dir, 'index.js'), code);
    };
    await writePackage(
      'dev-server-esm-only',
      { exports: { '.': { import: './index.js' } } },
      "export const value = 'esm-only';\n",
    );
    await writePackage(
      'dev-server-esm-tla',
      { main: './index.js' },
      "await Promise.resolve();\nexport const value = 'esm-tla';\n",
    );
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {}, {});
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
    await cleanup?.();
  });

  test('should load ESM-only packages through dynamic import', async () => {
    const res = await fetch(`http://localhost:${appPort}/`, {
      headers: { 'x-esm-import': '1' },
    });
    expect(res.headers.get('x-esm-import')).toBe('esm-only,esm-tla,v1');
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
