import { defineMcpServer } from '@modern-js/mcp-apps/config';
import { name, version } from '../package.json';
import { addNumbers, greet } from './mcp-tools';

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
      ...greet,
      remote: 'mcp_ui',
      visibility: ['model', 'app'],
      view: { module: './Greeting' },
    },
    {
      ...addNumbers,
      remote: 'mcp_ui',
      visibility: ['model', 'app'],
      view: { module: './Sum' },
    },
  ],
});
