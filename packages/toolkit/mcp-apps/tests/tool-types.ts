import { defineMcpServer, defineTool } from '../src/config';
import type { InferToolInput, InferToolOutput } from '../src/config';

const tool = defineTool({
  name: 'typed',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      count: { type: 'integer' },
      mode: { enum: ['short', 'long'] },
      items: { type: 'array', items: { type: 'number' } },
    },
    required: ['name', 'count', 'mode'],
  },
  handler: async ({ name, count, mode, items }) => {
    const label: string = name;
    const amount: number = count;
    const choice: 'short' | 'long' = mode;
    const values: number[] | undefined = items;
    // @ts-expect-error schema infers string, not number
    const invalid: number = name;
    void invalid;
    return { structuredContent: { label, amount, choice, values } };
  },
});
const input: InferToolInput<typeof tool> = {
  name: 'Ada',
  count: 1,
  mode: 'short',
};
// @ts-expect-error required input fields must be present
const missing: InferToolInput<typeof tool> = { name: 'Ada' };
const badMode: InferToolInput<typeof tool> = {
  name: 'Ada',
  count: 1,
  // @ts-expect-error enum excludes other strings
  mode: 'other',
};
const output: InferToolOutput<typeof tool> = {
  label: 'Ada',
  amount: 1,
  choice: 'long',
  values: [],
};
const badOutput: InferToolOutput<typeof tool> = {
  // @ts-expect-error output is inferred from awaited handler result
  label: 42,
  amount: 1,
  choice: 'long',
  values: [],
};
void [input, missing, badMode, output, badOutput];

const server = defineMcpServer({
  name: 'inline',
  version: '1',
  tools: [
    {
      name: 'greet',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string' }, count: { type: 'number' } },
        required: ['name'],
      },
      handler: async ({ name, count }) => {
        const label: string = name;
        const optional: number | undefined = count;
        // @ts-expect-error independent schema infers string
        const invalid: number = name;
        void [optional, invalid];
        return { structuredContent: { label } };
      },
    },
    {
      name: 'sum',
      inputSchema: {
        type: 'object',
        properties: { a: { type: 'number' } },
        required: ['a'],
      },
      handler: ({ a }) => {
        const sum: number = a;
        // @ts-expect-error second tool uses its own schema
        const invalid: string = a;
        void invalid;
        return { structuredContent: { sum } };
      },
    },
    tool,
    { name: 'module', handler: { module: './handler.ts' } },
    {
      name: 'empty',
      handler: input => {
        // @ts-expect-error tools without schema have unknown input
        input.name;
        return { content: [] };
      },
    },
  ],
});

const preconfigured: import('../src/config').McpServerDefinition = {
  name: 'existing',
  version: '1',
  tools: [{ name: 'remote', remote: 'backend' }],
};
defineMcpServer(preconfigured);
void server;

const inlineOutput: InferToolOutput<(typeof server.tools)[0]> = {
  label: 'Ada',
};
void inlineOutput;

const invalidInlineOutput: InferToolOutput<(typeof server.tools)[0]> = {
  // @ts-expect-error inline tool output preserves handler result
  label: 42,
};
const inlineInput: InferToolInput<(typeof server.tools)[0]> = { name: 'Ada' };
// @ts-expect-error inline tool input preserves required schema fields
const invalidInlineInput: InferToolInput<(typeof server.tools)[0]> = {};
const identity: 'inline' = server.name;
void [invalidInlineOutput, inlineInput, invalidInlineInput, identity];

const reusedOutput: InferToolOutput<(typeof server.tools)[2]> = output;
const sumOutput: InferToolOutput<(typeof server.tools)[1]> = { sum: 1 };
// @ts-expect-error synchronous output uses its own handler result
const invalidSum: InferToolOutput<(typeof server.tools)[1]> = { sum: '1' };
void [reusedOutput, sumOutput, invalidSum];

const shorthandServer = defineMcpServer({
  name: 'shorthand',
  version: '1',
  tools: [
    {
      name: 'greet',
      inputSchema: {
        name: { type: 'string', minLength: 1 },
        count: { type: 'integer', optional: true },
        mode: { enum: ['short', 'long'] },
        values: { type: 'array', items: { type: 'number' }, optional: true },
        address: {
          type: 'object',
          properties: { city: { type: 'string' } },
          required: ['city'],
        },
      },
      handler: ({ name, count, mode, values, address }) => {
        const label: string = name;
        const amount: number | undefined = count;
        const choice: 'short' | 'long' = mode;
        const items: number[] | undefined = values;
        const city: string = address.city;
        // @ts-expect-error shorthand preserves field types
        const invalid: number = name;
        void [amount, choice, items, city, invalid];
        return { structuredContent: { label } };
      },
    },
  ],
});
const shorthandInput: InferToolInput<(typeof shorthandServer.tools)[0]> = {
  name: 'Ada',
  mode: 'short',
  address: { city: 'Paris' },
};
// @ts-expect-error shorthand defaults to required
const missingShorthand: InferToolInput<(typeof shorthandServer.tools)[0]> = {
  name: 'Ada',
};
const standaloneShorthand = defineTool({
  name: 'short',
  inputSchema: { value: { type: 'number' } },
  handler: ({ value }) => ({ structuredContent: { sum: value + 1 } }),
});
const standaloneInput: InferToolInput<typeof standaloneShorthand> = {
  value: 1,
};
// @ts-expect-error full schemas without type retain unknown inference
const unknownSchema: string = {} as import('../src/config').InferSchema<{
  properties: { name: { type: 'string' } };
}>;
void [shorthandInput, missingShorthand, standaloneInput, unknownSchema];
