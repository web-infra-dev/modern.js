import { describe, expect, it } from '@rstest/core';
import { proxyFixtureRpc } from '../scripts/fixture-rpc.mjs';
import { readRpcResponse } from './browser/rpc';

describe('test host connection diagnostics', () => {
  it('preserves empty accepted notification responses', async () => {
    const response = await proxyFixtureRpc(
      'http://localhost/mcp',
      '{}',
      async () => new Response(null, { status: 202 }),
    );
    expect(response.status).toBe(202);
    expect(await readRpcResponse(response)).toBeUndefined();
  });
  it('shows the selected endpoint and connection error rather than a JSON parse failure', async () => {
    const response = await proxyFixtureRpc(
      'http://127.0.0.1:8080/mcp',
      '{}',
      async () => {
        throw new Error('fetch failed', { cause: { code: 'ECONNREFUSED' } });
      },
    );
    expect(response.status).toBe(502);
    await expect(readRpcResponse(response)).rejects.toThrow(
      'http://127.0.0.1:8080/mcp: ECONNREFUSED',
    );
  });
  it('reports non-JSON upstream errors with their HTTP status', async () => {
    const response = await proxyFixtureRpc(
      'http://localhost/mcp',
      '{}',
      async () => new Response('Not found', { status: 404 }),
    );
    await expect(readRpcResponse(response)).rejects.toThrow(
      'HTTP 404, not JSON: Not found',
    );
  });
  it('handles old test-host plain-text failures without hiding the error', async () => {
    await expect(
      readRpcResponse(new Response('Fixture failed', { status: 500 })),
    ).rejects.toThrow('HTTP 500, not JSON: Fixture failed');
  });
  it('preserves successful JSON-RPC results', async () => {
    const response = await proxyFixtureRpc(
      'http://localhost/mcp',
      '{}',
      async () =>
        Response.json({ jsonrpc: '2.0', id: 1, result: { tools: [] } }),
    );
    expect(await readRpcResponse(response)).toEqual({ tools: [] });
  });
});
