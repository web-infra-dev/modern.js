import { defineTool } from '@modern-js/mcp-apps/config';

export const greet = defineTool({
  name: 'greet',
  description: 'Greet someone.',
  inputSchema: {
    type: 'object',
    properties: { name: { type: 'string', minLength: 1 } },
    required: ['name'],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
  handler: async ({ name }) => {
    const message = `Hello, ${name}!`;
    return {
      content: [{ type: 'text', text: message }],
      structuredContent: { message },
      viewProps: { message },
    };
  },
});

export const addNumbers = defineTool({
  name: 'add_numbers',
  description: 'Add two numbers.',
  inputSchema: {
    type: 'object',
    properties: { a: { type: 'number' }, b: { type: 'number' } },
    required: ['a', 'b'],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
  handler: ({ a, b }) => {
    const sum = a + b;
    return {
      content: [{ type: 'text', text: `${a} + ${b} = ${sum}` }],
      structuredContent: { a, b, sum },
      viewProps: { a, b, sum },
    };
  },
});
