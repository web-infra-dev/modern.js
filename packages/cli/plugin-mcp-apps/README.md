# @modern-js/plugin-mcp-apps

Modern.js integration for MCP tools and interactive React views.

```ts
import { appTools, defineConfig } from '@modern-js/app-tools';
import { bffPlugin } from '@modern-js/plugin-bff';
import { mcpAppsPlugin } from '@modern-js/plugin-mcp-apps';

export default defineConfig({
  plugins: [appTools(), bffPlugin(), mcpAppsPlugin()],
});
```

Define tools and views in `mcp_apps.ts`. The plugin registers `/mcp`, builds local UI resources, and provides `/mcp/inspector` during development.

For an independently managed MCP server, use `mcpAppsPlugin({ mode: 'ui-only' })` without the BFF plugin to build UI resources and a manifest.

## Documentation

- [Getting started](https://modernjs.dev/en/guides/advanced-features/mcp-apps/quick-start)
- [Existing applications](https://modernjs.dev/en/guides/advanced-features/mcp-apps/existing-project)
- [Local debugging](https://modernjs.dev/en/guides/advanced-features/mcp-apps/debugging)
- [Build and deploy](https://modernjs.dev/en/guides/advanced-features/mcp-apps/deployment)
- [Plugin options](https://modernjs.dev/en/guides/advanced-features/mcp-apps/api#plugin-options)
- [中文文档](https://modernjs.dev/guides/advanced-features/mcp-apps)
