import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const development = process.env.MCP_APPS_RUNTIME_MODE === 'development';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      [development ? 'mcp-app.dev' : 'mcp-app']: './src/runtime/mcp-app.tsx',
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(
        development ? 'development' : 'production',
      ),
    },
  },
  html: {
    template: './src/runtime/mcp-app.html',
    inject: 'body',
  },
  output: {
    distPath: { root: './dist/runtime' },
    inlineScripts: true,
    inlineStyles: true,
    legalComments: 'inline',
    cleanDistPath: false,
  },
  tools: {
    rspack: {
      optimization: { nodeEnv: false },
      module: { parser: { javascript: { dynamicImportMode: 'eager' } } },
    },
  },
});
