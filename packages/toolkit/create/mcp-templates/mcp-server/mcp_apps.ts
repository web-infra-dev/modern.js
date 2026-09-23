import { defineMcpApps } from '@modern-js/mcp-apps/config';

export default defineMcpApps({
  remotes: [],
  tools: [
    {
      name: 'greet',
      description: 'Greet someone.',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string', minLength: 1 } },
        required: ['name'],
      },
      annotations: { readOnlyHint: true },
      handler: { module: './mcp/tools', exportName: 'greet' },
    },
  ],
});
