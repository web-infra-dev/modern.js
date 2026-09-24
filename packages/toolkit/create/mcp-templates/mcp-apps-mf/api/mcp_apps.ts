import { defineMcpApps } from '@modern-js/mcp-apps/config';
import { addNumbers, greet } from './mcp-tools';

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
      handler: greet,
      view: { module: './Greeting' },
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
      remote: 'mcp_ui',
      view: { module: './Sum' },
    },
  ],
});
