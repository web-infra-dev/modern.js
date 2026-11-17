import { appTools } from '@modern-js/app-tools';
import { bffPlugin } from '@modern-js/plugin-bff';
import { mcpAppsPlugin } from '@modern-js/mcp-apps/cli';
import { moduleFederationPlugin } from '@module-federation/modern-js-v3';

const isStdio = process.argv.includes('mcp-prepare');

export default {
  server: { port: Number(process.env.PORT ?? 8088) },
  plugins: [
    appTools(),
    bffPlugin(),
    ...(!isStdio ? [moduleFederationPlugin()] : []),
    mcpAppsPlugin({
      views: isStdio ? './mcp-views.stdio.json' : './mcp-views.json',
      stdio: { server: './api/server/mcp.ts' },
    }),
  ],
};
