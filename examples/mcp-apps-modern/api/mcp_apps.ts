import { defineMcpApps } from '@modern-js/mcp-apps/config';
import { addNumbers, greet } from './mcp-tools';

export default defineMcpApps({
  remotes: [],
  tools: [
    {
      name: 'greet',
      description: 'Greet someone with an interactive card.',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string', minLength: 1 } },
        required: ['name'],
      },
      annotations: { readOnlyHint: true },
      handler: greet,
      view: { module: './src/components/Greeting.tsx' },
    },
    {
      name: 'add_numbers',
      description: 'Add two numbers and show the result.',
      inputSchema: {
        type: 'object',
        properties: { a: { type: 'number' }, b: { type: 'number' } },
        required: ['a', 'b'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      handler: addNumbers,
      view: { module: './src/components/Sum.tsx' },
    },
  ],
});
