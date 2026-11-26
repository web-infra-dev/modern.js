import type { ChildProcess } from 'node:child_process';
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
  let app: ChildProcess;
  let output = '';
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
    app = (await launchApp(appDir, appPort, {
      onStdout: (message: string) => {
        output += message;
      },
    })) as ChildProcess;
    app.stderr?.on('data', chunk => {
      output += chunk.toString();
    });
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

  test('should reload imported server files and recover after a failed reload', async () => {
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

    output = '';
    await fs.writeFile(
      sharedFile,
      `${content}\nthrow new Error('intentional-server-reload-failure');\n`,
    );
    // Wait until the broken edit was processed, not just the debounce window.
    for (
      let i = 0;
      i < 40 && !output.includes('runtime reload build failed');
      i++
    ) {
      await sleep(250);
    }
    expect(output).toContain('runtime reload build failed');
    expect(output).toContain('intentional-server-reload-failure');
    expect(app.exitCode).toBeNull();
    expect(await getReloadHeader()).toBe('v2');

    await fs.writeFile(sharedFile, content.replace("'v1'", "'recovered'"));
    for (let i = 0; i < 40 && header !== 'recovered'; i++) {
      await sleep(250);
      header = await getReloadHeader();
    }
    expect(header).toBe('recovered');
    expect(app.exitCode).toBeNull();
  });
});
