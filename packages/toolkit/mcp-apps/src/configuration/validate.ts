import type { McpAppsDefinition } from './index';
import { normalizeToolConfig } from './normalize';

export function validateMcpAppsConfig(config: McpAppsDefinition): void {
  if (
    !Array.isArray(config.remotes) ||
    !Array.isArray(config.tools) ||
    !config.tools.length
  ) {
    throw new Error('mcp_apps requires remotes and at least one tool');
  }
  const names = new Set<string>();
  for (const remote of config.remotes) {
    if (!remote.name || names.has(remote.name))
      throw new Error('Remote names must be non-empty and unique');
    names.add(remote.name);
    for (const address of [remote.baseUrl, remote.browserEntry]) {
      if (address === undefined) continue;
      const url = new URL(
        address.startsWith('//') ? `https:${address}` : address,
      );
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.username ||
        url.password
      )
        throw new Error(`Invalid remote URL: ${address}`);
    }
    if (!remote.baseUrl)
      throw new Error(`Remote "${remote.name}" requires baseUrl`);
  }
  for (const tool of config.tools.map(tool =>
    normalizeToolConfig(tool, config.viewDefaults),
  )) {
    if (tool.remote !== undefined && !names.has(tool.remote))
      throw new Error(
        `Tool "${tool.name}" references missing remote "${tool.remote}". Configure remotes[] with an explicit manifest baseUrl.`,
      );
    if (!tool.view && !tool.handler)
      throw new Error(`Tool "${tool.name}" must define a view or handler`);
    if (tool.view && !tool.view.module)
      throw new Error(`Tool "${tool.name}" view requires module`);
    if (tool.view && !['component', 'mount'].includes(tool.view.renderMode))
      throw new Error('Unsupported renderMode');
    if (tool.view?.runtime && tool.view.runtime !== 'browser')
      throw new Error('Unsupported view runtime');
    if (
      tool.handler &&
      typeof tool.handler !== 'function' &&
      (!tool.handler.module || (tool.handler.runtime ?? 'local') !== 'local')
    )
      throw new Error(`Invalid handler for "${tool.name}"`);
  }
}
