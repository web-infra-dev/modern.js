import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from '@rstest/core';
import { compileMcpApps } from '../src/build';
import { createMcpAppsHandler } from '../src/server';

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(
    dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })),
  );
});
async function fixture() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'modern-mcp-build-'));
  dirs.push(dir);
  await writeFile(
    path.join(dir, 'mcp_apps.ts'),
    `export const config = { remotes: [], tools: [{ name: 'greet', handler: { module: './handler', exportName: 'greet' } }] };`,
  );
  await writeFile(
    path.join(dir, 'helper.ts'),
    `export const message: string = 'first';`,
  );
  await writeFile(
    path.join(dir, 'handler.ts'),
    `import { message } from './helper'; export const greet = () => ({ content: [], structuredContent: { message } });`,
  );
  return dir;
}
function request() {
  return new Request('http://localhost/mcp', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'greet' },
    }),
  });
}

describe('relocatable MCP compilation', () => {
  it('selects matching React runtimes for development and production artifacts', async () => {
    const dir = await fixture();
    await writeFile(
      path.join(dir, 'mcp_apps.ts'),
      `export default { remotes: [{ name: 'ui', baseUrl: 'https://example.com/mf-manifest.json' }], tools: [{ name: 'greet', handler: { module: './handler', exportName: 'greet' } }] };`,
    );
    const configPath = path.join(dir, 'mcp_apps.ts');
    await compileMcpApps({
      configPath,
      outDir: path.join(dir, 'dev'),
      development: true,
    });
    await compileMcpApps({ configPath, outDir: path.join(dir, 'prod') });
    expect(
      await readFile(path.join(dir, 'dev/runtime.html'), 'utf8'),
    ).toContain('react-dom-client.development.js');
    const production = await readFile(
      path.join(dir, 'prod/runtime.html'),
      'utf8',
    );
    expect(production).toContain('react-dom-client.production.js');
    expect(production).not.toContain('react-dom-client.development.js');
  });
  it('bundles handler dependencies and runs after source deletion and relocation', async () => {
    const dir = await fixture();
    const built = await compileMcpApps({
      configPath: path.join(dir, 'mcp_apps.ts'),
      outDir: path.join(dir, 'output'),
    });
    expect(built.dependencies).toContain(path.join(dir, 'helper.ts'));
    const relocated = await mkdtemp(
      path.join(os.tmpdir(), 'modern-mcp-release-'),
    );
    dirs.push(relocated);
    await cp(path.join(dir, 'output'), relocated, { recursive: true });
    await rm(dir, { recursive: true });
    const response = await createMcpAppsHandler({
      configPath: path.join(relocated, 'mcp_apps.mjs'),
    })(request());
    expect((await response.json()).result.structuredContent.message).toBe(
      'first',
    );
    await expect(
      readFile(path.join(relocated, 'runtime.html'), 'utf8'),
    ).rejects.toThrow();
  });

  it('keeps the old compiled entry on failure and refreshes imported JS dependencies', async () => {
    const dir = await fixture();
    const options = {
      configPath: path.join(dir, 'mcp_apps.ts'),
      outDir: path.join(dir, 'output'),
    };
    const first = await compileMcpApps(options);
    const before = await readFile(first.entry, 'utf8');
    await writeFile(path.join(dir, 'helper.ts'), 'not valid TypeScript !!!');
    await expect(compileMcpApps(options)).rejects.toThrow();
    expect(await readFile(first.entry, 'utf8')).toBe(before);
    await writeFile(
      path.join(dir, 'helper.ts'),
      `export const message = 'second';`,
    );
    await compileMcpApps(options);
    const response = await createMcpAppsHandler({ configPath: first.entry })(
      request(),
    );
    expect((await response.json()).result.structuredContent.message).toBe(
      'second',
    );
  });

  it('uses tsconfig aliases and does not evaluate handler side effects at build time', async () => {
    const dir = await fixture();
    await mkdir(path.join(dir, 'lib'));
    await writeFile(
      path.join(dir, 'lib/value.ts'),
      `export const value = 'alias';`,
    );
    await writeFile(
      path.join(dir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: { baseUrl: '.', paths: { '@lib/*': ['lib/*'] } },
      }),
    );
    await writeFile(
      path.join(dir, 'handler.ts'),
      `import { value } from '@lib/value'; throw new Error('evaluated-handler'); export const greet = () => ({ content: [], structuredContent: { value } });`,
    );
    const result = await compileMcpApps({
      configPath: path.join(dir, 'mcp_apps.ts'),
      outDir: path.join(dir, 'output'),
    });
    expect(result.dependencies).toContain(path.join(dir, 'lib/value.ts'));
  });
});
