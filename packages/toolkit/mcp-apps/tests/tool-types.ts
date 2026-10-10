import { defineTool } from '../src/config';
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
