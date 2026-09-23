import { appTools, defineConfig } from '@modern-js/app-tools';
import { bffPlugin } from '@modern-js/plugin-bff';
import { mcpAppsPlugin } from '@modern-js/plugin-mcp-apps';

export default defineConfig({
  bff: { prefix: '/mcp' },
  server: { port: Number(process.env.PORT ?? 8080) },
  plugins: [appTools(), bffPlugin(), mcpAppsPlugin()],
});
