import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it } from '@rstest/core';
import type { McpAppsDefinition } from '../src/config';
import { createMcpHandler } from '../src/server';
import { bindUiResources, getUiEntryName } from '../src/ui-resources';

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(
    dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })),
  );
});

it('uses externally built HTML without compiling the UI source and isolates request asset origins', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'modern-built-ui-'));
  dirs.push(dir);
  const definition: McpAppsDefinition = {
    remotes: [],
    tools: [{ name: 'card', view: { module: './not-compiled-here.tsx' } }],
  };
  await writeFile(
    path.join(dir, `${getUiEntryName('card')}.html`),
    '<html><head></head><body><script src="/static/card.js"></script></body></html>',
  );
  const handle = createMcpHandler(
    bindUiResources(definition, { directory: dir, assetBase: 'request' }),
  );
  for (const host of ['one.example', 'two.example']) {
    const response = await handle(
      new Request(`http://${host}/mcp`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
          'x-forwarded-proto': 'https',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'resources/read',
          params: { uri: 'ui://local/card' },
        }),
      }),
    );
    const content = (await response.json()).result.contents[0];
    expect(content.text).toContain(`<base href="https://${host}/">`);
    expect(content.text).toContain('src="/static/card.js"');
    expect(content._meta.ui.csp.resourceDomains).toEqual([`https://${host}`]);
    expect(content._meta.ui.csp.baseUriDomains).toEqual([`https://${host}`]);
  }
  expect(definition.tools[0].view?.html).toBeUndefined();
});
