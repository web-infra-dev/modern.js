import { appTools, defineConfig } from '@modern-js/app-tools';
import { bffPlugin } from '@modern-js/plugin-bff';
import { mcpAppsPlugin } from '@modern-js/plugin-mcp-apps';
import { moduleFederationPlugin } from '@module-federation/modern-js-v3';

export default defineConfig({
  server: { port: Number(process.env.PORT ?? 8080) },
  plugins: [
    appTools(),
    bffPlugin(),
    moduleFederationPlugin(),
    mcpAppsPlugin({ endpoint: '/mcp' }),
  ],
});
