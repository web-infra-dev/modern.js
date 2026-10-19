import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createNodeServer } from '@modern-js/server-core/node';
import { afterEach, describe, expect, it } from '@rstest/core';
import { createArtifactHandler } from '@modern-js/mcp-apps/server';

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(
    dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })),
  );
});
async function fixture() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'modern-mcp-plugin-'));
  dirs.push(dir);
  await mkdir(path.join(dir, 'dist/mcp-apps'), { recursive: true });
  const entry = path.join(dir, 'dist/mcp-apps/mcp_apps.mjs');
  await writeFile(
    entry,
    `export default { remotes: [], tools: [{ name: 'who', handler: (_, ctx) => ({ content: [], structuredContent: { user: ctx.context.get('user'), version: 'first' } }) }] };`,
  );
  return { dir, entry };
}
describe('Modern.js server integration', () => {
  it('reads a POST body through the real Modern.js Node request proxy', async () => {
    const f = await fixture();
    const h = createArtifactHandler(f.entry, { development: false });
    const server = await createNodeServer(request =>
      h.handle(request, new Map([['user', 'Node']])),
    );
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      if (!address || typeof address === 'string')
        throw new Error('Missing address');
      const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: { name: 'who' },
        }),
        signal: AbortSignal.timeout(3000),
      });
      expect((await response.json()).result.structuredContent.user).toBe(
        'Node',
      );
    } finally {
      h.reset();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
