import { createHash } from 'node:crypto';
import path from 'node:path';
import type { McpAppsDefinition } from './config';

export function getUiEntryName(toolName: string) {
  return `mcp-ui-${createHash('sha256').update(toolName).digest('hex').slice(0, 12)}`;
}

/** Attach application-emitted HTML without changing tool handlers or imports. */
export function bindUiResources(
  definition: McpAppsDefinition,
  options: { directory: string; assetBase?: string },
): McpAppsDefinition {
  return {
    ...definition,
    tools: definition.tools.map(tool => {
      if (!tool.view || tool.remote || tool.view.html) return tool;
      return {
        ...tool,
        view: {
          ...tool.view,
          html: path.join(
            options.directory,
            `${getUiEntryName(tool.name)}.html`,
          ),
          assetBase: tool.view.assetBase ?? options.assetBase,
        },
      };
    }),
  };
}
