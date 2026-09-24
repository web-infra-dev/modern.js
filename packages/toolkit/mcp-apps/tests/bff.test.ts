import { describe, expect, it } from '@rstest/core';
import { createMcpBffHandler } from '../src/bff';

const handle = createMcpBffHandler({
  definition: {
    remotes: [],
    tools: [
      {
        name: 'who',
        handler: (_, ctx) => ({
          content: [],
          structuredContent: { user: (ctx.context as { user: string }).user },
        }),
      },
    ],
  },
});

async function call(
  body: string,
  user = 'Ada',
  accept = 'application/json, text/event-stream',
) {
  const raw = new Request('http://localhost/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept },
    body,
  });
  let data: unknown;
  try {
    data = await raw.json();
  } catch {
    // BFF's input parser consumes invalid JSON and leaves data undefined.
  }
  expect(raw.bodyUsed).toBe(true);
  return handle({ data }, { req: { raw }, user } as Parameters<
    typeof handle
  >[1]);
}

describe('BFF MCP adapter', () => {
  it('handles consumed bodies and isolates concurrent request contexts', async () => {
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'who' },
    });
    const users = await Promise.all(
      ['Ada', 'Grace'].map(async user => {
        const response = await call(body, user);
        expect(response.status).toBe(200);
        return (await response.json()).result.structuredContent.user;
      }),
    );
    expect(users).toEqual(['Ada', 'Grace']);
  });

  it('preserves notification, parse-error and Accept-header behavior', async () => {
    const notification = await call(
      JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    );
    expect(notification.status).toBe(202);
    expect(await notification.text()).toBe('');
    const invalid = await call('{broken');
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).error.code).toBe(-32700);
    const unacceptable = await call(
      JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
      'Ada',
      'text/html',
    );
    expect(unacceptable.status).toBe(406);
  });

  it('rejects unsupported methods without falling through to page rendering', async () => {
    for (const method of ['GET', 'DELETE', 'HEAD', 'OPTIONS', 'PUT', 'PATCH']) {
      const response = await handle(
        {},
        { req: { raw: new Request('http://localhost/mcp', { method }) } },
      );
      expect(response.status).toBe(405);
      expect(response.headers.get('allow')).toBe('POST');
    }
  });
});
