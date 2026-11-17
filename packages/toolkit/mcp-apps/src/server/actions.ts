import type { McpServer } from '@modelcontextprotocol/server';
import type { z } from 'zod';
import { type ActionContracts } from '../actions';

export type ActionHandlers<C extends ActionContracts> = {
  [K in keyof C]: (
    input: z.output<C[K]['input']>,
    context: { signal: AbortSignal },
  ) => z.input<C[K]['output']> | Promise<z.input<C[K]['output']>>;
};
export interface ActionBindingOptions {
  resourceUri?: string;
}
/** SDK registration and the browser client consume the exact same schema contract. */
export function registerActions<C extends ActionContracts>(
  server: McpServer,
  contracts: C,
  handlers: ActionHandlers<C>,
  options: Partial<Record<keyof C, ActionBindingOptions>> = {},
) {
  const names = new Set<string>();
  for (const [key, contract] of Object.entries(contracts)) {
    if (names.has(contract.name))
      throw new Error(`Duplicate action tool: ${contract.name}`);
    if (typeof handlers[key] !== 'function')
      throw new Error(`Missing action handler: ${key}`);
    names.add(contract.name);
  }
  for (const [key, contract] of Object.entries(contracts)) {
    server.registerTool(
      contract.name,
      {
        title: contract.title,
        description: contract.description,
        inputSchema: contract.input,
        outputSchema: contract.output,
        annotations: { readOnlyHint: contract.readOnly ?? false },
        _meta: {
          ui: {
            visibility: contract.visibility,
            ...(options[key]?.resourceUri
              ? { resourceUri: options[key].resourceUri }
              : {}),
          },
        },
      },
      async (input, extra) => {
        try {
          const output = contract.output.parse(
            await handlers[key](
              contract.input.parse(input) as z.output<C[string]['input']>,
              { signal: extra.mcpReq.signal },
            ),
          );
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(output) }],
            structuredContent: output,
          };
        } catch (error) {
          if (
            !(error instanceof Error) ||
            !('code' in error) ||
            error.code !== 'MCP_ACTION_ERROR'
          )
            throw error;
          return {
            isError: true,
            content: [{ type: 'text' as const, text: error.message }],
          };
        }
      },
    );
  }
}
