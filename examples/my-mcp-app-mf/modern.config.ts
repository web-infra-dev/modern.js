import {
  type AppTools,
  type CliPlugin,
  appTools,
  defineConfig,
} from '@modern-js/app-tools';
import { bffPlugin } from '@modern-js/plugin-bff';
import { mcpAppsPlugin } from '@modern-js/plugin-mcp-apps';
import { moduleFederationPlugin } from '@module-federation/modern-js-v3';

const port = Number(process.env.PORT ?? 8080);
const origin = (
  process.env.MCP_UI_ORIGIN ?? `http://localhost:${port}`
).replace(/\/+$/, '');

export default defineConfig({
  server: { port },
  dev: { assetPrefix: origin },
  output: { assetPrefix: origin },
  plugins: [
    appTools(),
    bffPlugin(),
    // The published MF plugin uses a separately versioned Modern.js type graph.
    moduleFederationPlugin() as unknown as CliPlugin<AppTools>,
    mcpAppsPlugin({ endpoint: '/mcp' }),
  ],
});
