import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from '@rstest/core';
import { mcpAppsPlugin } from '../src/cli';
import { viewEntryName } from '../src/cli/build';

type Entrypoint = {
  entryName: string;
  entry: string;
  absoluteEntryDir?: string;
};
type ModifyEntrypoints = (input: {
  entrypoints: Entrypoint[];
}) => Promise<{ entrypoints: Entrypoint[] }>;

const packageRoot = path.resolve(__dirname, '..');
let internalDirectory: string;
afterEach(async () => {
  await rm(internalDirectory, { recursive: true, force: true });
});

async function setupEntries(enableAsyncEntry: boolean) {
  internalDirectory = await mkdtemp(path.join(os.tmpdir(), 'mcp-entries-'));
  let modifyEntrypoints!: ModifyEntrypoints;
  const noop = () => {};
  mcpAppsPlugin({ views: 'tests/fixtures/mcp-views.json' }).setup!({
    getAppContext: () => ({
      appDirectory: packageRoot,
      internalDirectory,
      command: 'build',
    }),
    getNormalizedConfig: () => ({ source: { enableAsyncEntry } }),
    addWatchFiles: noop,
    modifyEntrypoints: (fn: ModifyEntrypoints) => {
      modifyEntrypoints = fn;
    },
    _internalServerPlugins: noop,
    modifyRsbuildConfig: noop,
    onAfterCreateCompiler: noop,
  } as never);
  return modifyEntrypoints;
}

describe('mcpAppsPlugin local card entries', () => {
  const entryName = viewEntryName('local');
  const entryDir = () => path.join(internalDirectory, 'mcp-apps/entries');

  it('mounts the card directly when enableAsyncEntry is off', async () => {
    const modify = await setupEntries(false);
    const { entrypoints } = await modify({ entrypoints: [] });
    expect(entrypoints).toEqual([
      expect.objectContaining({
        entryName,
        entry: path.join(entryDir(), `${entryName}.jsx`),
        isAutoMount: false,
      }),
    ]);
    expect(await readdir(entryDir())).toEqual([`${entryName}.jsx`]);
    const code = await readFile(entrypoints[0].entry, 'utf8');
    expect(code).toContain('createRoot(');
    expect(code).not.toContain('import(');
  });

  it('adds an async boundary when enableAsyncEntry is on', async () => {
    const modify = await setupEntries(true);
    const { entrypoints } = await modify({ entrypoints: [] });
    const mount = path.join(entryDir(), `${entryName}-mount.jsx`);
    expect(await readFile(entrypoints[0].entry, 'utf8')).toBe(
      `import(${JSON.stringify(mount)});\n`,
    );
    expect(await readFile(mount, 'utf8')).toContain('createRoot(');
  });

  it('imports the SDK from this package rather than the application', async () => {
    const modify = await setupEntries(false);
    const { entrypoints } = await modify({ entrypoints: [] });
    expect(await readFile(entrypoints[0].entry, 'utf8')).toContain(
      `import { createMcpView } from ${JSON.stringify(path.join(packageRoot, 'dist/esm/react.mjs'))};`,
    );
  });

  it('replaces its own entries when the hook runs again on reused entrypoints', async () => {
    const modify = await setupEntries(false);
    const app = { entryName: 'main', entry: '/app/src/main.tsx' };
    const first = await modify({ entrypoints: [app] });
    const second = await modify({ entrypoints: first.entrypoints });
    expect(second.entrypoints.map(entry => entry.entryName)).toEqual([
      'main',
      entryName,
    ]);
  });

  it('still rejects an application entry with the same name', async () => {
    const modify = await setupEntries(false);
    await expect(
      modify({ entrypoints: [{ entryName, entry: '/app/src/conflict.tsx' }] }),
    ).rejects.toThrow(
      `MCP entry conflicts with application entry: ${entryName}`,
    );
  });
});
