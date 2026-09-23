import { defineMcpApps } from '@modern-js/mcp-apps/config';

const origin = (
  process.env.MCP_UI_ORIGIN ?? `http://localhost:${process.env.PORT ?? 8080}`
).replace(/\/+$/, '');
export default defineMcpApps({
  remotes: [
    {
      name: 'mcp_ui',
      baseUrl: `${origin}/static/mf-manifest.json`,
      manifestType: 'mf',
      csp: { resourceDomains: [origin], connectDomains: [origin] },
    },
  ],
  tools: [
    {
      name: 'greet',
      description: 'Greet someone with an interactive card.',
      remote: 'mcp_ui',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string', minLength: 1 } },
        required: ['name'],
      },
      annotations: { readOnlyHint: true },
      handler: { module: './mcp/tools', exportName: 'greet' },
      view: { module: './Greeting' },
    },
  ],
});
