import type { z } from 'zod';

export interface ActionContract<
  I extends z.ZodObject = z.ZodObject,
  O extends z.ZodObject = z.ZodObject,
> {
  name: string;
  description: string;
  title?: string;
  input: I;
  output: O;
  visibility: Array<'model' | 'app'>;
  readOnly?: boolean;
}
/** Shared browser-safe contract. Bind server handlers in a server-only module. */
export function defineAction<I extends z.ZodObject, O extends z.ZodObject>(
  contract: ActionContract<I, O>,
): ActionContract<I, O> {
  if (!/^[a-zA-Z0-9_.:/-]{1,128}$/.test(contract.name))
    throw new Error('Invalid action tool name');
  if (!contract.visibility.length)
    throw new Error('Action visibility must be explicit');
  return contract;
}
export type ActionContracts = Record<string, ActionContract>;
export type ActionInput<A extends ActionContract> = z.input<A['input']>;
export type ActionOutput<A extends ActionContract> = z.output<A['output']>;
export class ActionError extends Error {
  readonly code = 'MCP_ACTION_ERROR';
  constructor(message: string) {
    super(message);
    this.name = 'ActionError';
  }
}
export interface ActionToolResult {
  isError?: boolean;
  content?: Array<{ type: string; text?: string }>;
  structuredContent?: unknown;
}
export type ActionClient<C extends ActionContracts> = {
  [K in keyof C]: (
    input: ActionInput<C[K]>,
    options?: { signal?: AbortSignal },
  ) => Promise<ActionOutput<C[K]>>;
};
export function createActionClient<C extends ActionContracts>(
  contracts: C,
  call: (
    params: { name: string; arguments: Record<string, unknown> },
    options?: { signal?: AbortSignal },
  ) => Promise<ActionToolResult>,
): ActionClient<C> {
  const client: Record<string, unknown> = Object.create(null);
  for (const [key, contract] of Object.entries(contracts)) {
    client[key] = async (
      input: unknown,
      options?: { signal?: AbortSignal },
    ) => {
      const args = contract.input.parse(input);
      const result = await call(
        { name: contract.name, arguments: args },
        options,
      );
      if (result.isError)
        throw new ActionError(
          result.content
            ?.filter(item => item.type === 'text')
            .map(item => item.text)
            .join('\n') || 'Action failed',
        );
      return contract.output.parse(result.structuredContent);
    };
  }
  return client as ActionClient<C>;
}
