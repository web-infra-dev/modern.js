import { it, expect, rs } from '@rstest/core';
import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { createBffHandlers, createFetchHandler } from '../src/server';

rs.mock('@modern-js/server-runtime', () => {
  throw new Error('Optional server-runtime is not installed');
});
const factory = () => {
  const server = new McpServer({ name: 'standalone', version: '1' });
  server.registerTool('ping', { inputSchema: z.object({}) }, async () => ({
    content: [],
  }));
  return server;
};

it('serves Fetch requests without loading the optional Modern.js runtime', async () => {
  const handle = createFetchHandler(factory);
  const response = await handle(
    new Request('https://app.example/mcp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    }),
  );
  expect(response.status).toBe(200);
  expect(await response.text()).toContain('ping');
});

it('loads the optional runtime only when invoking a BFF handler', async () => {
  const { POST } = createBffHandlers(factory);
  await expect(POST({})).rejects.toThrow(
    'Optional server-runtime is not installed',
  );
});
