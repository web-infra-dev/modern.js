import { it, expect } from '@rstest/core';
import { z } from 'zod';
import { McpServer, InMemoryTransport } from '@modelcontextprotocol/server';
import { Client } from '@modelcontextprotocol/client';
import { defineAction, createActionClient, ActionError } from '../src/actions';
import { registerActions } from '../src/server/actions';

const contracts = {
  increment: defineAction({
    name: 'increment',
    description: 'Increment a counter',
    input: z.object({ amount: z.number().int().positive() }),
    output: z.object({ count: z.number().int() }),
    visibility: ['app'],
  }),
};
it('shares schemas between a real MCP tool and the typed page client, preserving visibility and business errors', async () => {
  const server = new McpServer({ name: 'actions', version: '1' });
  let count = 0;
  registerActions(
    server,
    contracts,
    {
      increment: ({ amount }) => {
        if (amount > 5) throw new ActionError('Counter limit');
        return { count: (count += amount) };
      },
    },
    { increment: { resourceUri: 'ui://app/counter' } },
  );
  const client = new Client({ name: 'test', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  await client.connect(b);
  try {
    const tools = await client.listTools();
    expect(tools.tools[0]._meta).toMatchObject({
      ui: { visibility: ['app'], resourceUri: 'ui://app/counter' },
    });
    expect(tools.tools[0].outputSchema).toMatchObject({
      properties: { count: { type: 'integer' } },
    });
    const page = createActionClient(contracts, async (params, options) =>
      client.callTool(params, undefined, options),
    );
    await expect(page.increment({ amount: 2 })).resolves.toEqual({ count: 2 });
    await expect(page.increment({ amount: 9 })).rejects.toThrow(
      'Counter limit',
    );
    await expect(page.increment({ amount: -1 })).rejects.toThrow();
    expect(count).toBe(2);
    const error = await client.callTool({
      name: 'increment',
      arguments: { amount: 9 },
    });
    expect(error.isError).toBe(true);
  } finally {
    await client.close();
    await server.close();
  }
});
it('rejects malformed remote output and forwards cancellation options', async () => {
  const controller = new AbortController();
  const page = createActionClient(contracts, async (_params, options) => {
    expect(options?.signal).toBe(controller.signal);
    return { structuredContent: { count: 'incorrect' } };
  });
  await expect(
    page.increment({ amount: 1 }, { signal: controller.signal }),
  ).rejects.toThrow();
});
it('rejects missing handlers and duplicate names before registering any tools', () => {
  const server = new McpServer({ name: 'bad', version: '1' });
  expect(() => registerActions(server, contracts, {} as never)).toThrow(
    'Missing action',
  );
  expect(() =>
    registerActions(
      server,
      { a: contracts.increment, b: contracts.increment },
      { a: () => ({ count: 1 }), b: () => ({ count: 2 }) },
    ),
  ).toThrow('Duplicate action');
});
