import { defineMcpServer } from '@modern-js/mcp-apps/config';
import { name, version } from './package.json';

const origin = (
  process.env.MCP_UI_ORIGIN ?? `http://localhost:${process.env.PORT ?? 8080}`
).replace(/\/+$/, '');
export default defineMcpServer({
  name,
  version,
  remotes: [
    {
      name: 'mcp_ui',
      baseUrl: `${origin}/static/mf-manifest.json`,
      csp: { resourceDomains: [origin], connectDomains: [origin] },
    },
  ],
  tools: [
    {
      name: 'greet',
      description: 'Greet someone.',
      inputSchema: {
        name: { type: 'string', minLength: 1 },
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
      remote: 'mcp_ui',
      visibility: ['model', 'app'],
      view: { module: './Greeting' },
    },
    {
      name: 'add_numbers',
      description: 'Add two numbers.',
      inputSchema: {
        a: { type: 'number' },
        b: { type: 'number' },
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
      remote: 'mcp_ui',
      visibility: ['model', 'app'],
      view: { module: './Sum' },
    },
  ],
});
