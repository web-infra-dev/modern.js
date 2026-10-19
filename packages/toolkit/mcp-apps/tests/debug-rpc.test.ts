import { expect, it } from '@rstest/core';
import { DebugRpcClient } from '../src/debug-rpc';

it('preserves sessions, sends initialized notifications and reads SSE results after notifications', async () => {
  const requests: Array<{ headers: Headers; body: any }> = [];
  const client = new DebugRpcClient(new URL('http://localhost/mcp'), (async (
    _url,
    init,
  ) => {
    requests.push({
      headers: new Headers(init?.headers),
      body: JSON.parse(String(init?.body)),
    });
    if (requests.length === 1)
      return Response.json(
        { jsonrpc: '2.0', result: {} },
        { headers: { 'Mcp-Session-Id': 'test-session' } },
      );
    if (requests.length === 2) return new Response(null, { status: 202 });
    return new Response(
      'event: message\r\ndata: {"method":"notifications/progress"}\r\n\r\nevent: message\r\ndata: {"result":{"tools":[]}}\r\n\r\n',
      { headers: { 'content-type': 'text/event-stream' } },
    );
  }) as typeof fetch);
  await client.request('initialize', {});
  await client.request('notifications/initialized', undefined, true);
  expect(await client.request('tools/list')).toEqual({ tools: [] });
  expect(requests[1].body.id).toBeUndefined();
  expect(requests[2].headers.get('Mcp-Session-Id')).toBe('test-session');
});

it('reports HTTP and MCP errors instead of displaying them as tool results', async () => {
  for (const response of [
    new Response('unavailable', { status: 503 }),
    Response.json({ error: { message: 'Invalid arguments' } }),
  ]) {
    const client = new DebugRpcClient(
      new URL('http://localhost/mcp'),
      (async () => response) as typeof fetch,
    );
    await expect(client.request('tools/call', {})).rejects.toThrow();
  }
});

it('invokes fetch with the global receiver required by browsers', async () => {
  const fetcher = async function (this: unknown) {
    if (this !== globalThis) throw new TypeError('Illegal invocation');
    return Response.json({ jsonrpc: '2.0', result: { tools: [] } });
  };
  const client = new DebugRpcClient(
    new URL('http://localhost/mcp'),
    fetcher as typeof fetch,
  );
  expect(await client.request('tools/list')).toEqual({ tools: [] });
});
