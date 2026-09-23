import { defineMcpApps } from '@modern-js/mcp-apps/config';

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
      handler: { module: './mcp/tools', exportName: 'greet' },
      view: { module: './src/components/Greeting.tsx' },
    },
  ],
});
