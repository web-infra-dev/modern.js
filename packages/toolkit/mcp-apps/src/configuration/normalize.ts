import type {
  ToolConfig,
  McpAppsViewDefaults,
  NormalizedToolConfig,
} from './index';
import { normalizeInputSchema } from '../schema/input';

export function normalizeToolConfig(
  input: ToolConfig,
  defaults?: McpAppsViewDefaults,
): NormalizedToolConfig {
  let tool = input;
  if (tool.view && defaults) {
    const view = {
      ...tool.view,
      assetBase: tool.view.assetBase ?? defaults.assetBase,
      exportName: tool.view.exportName ?? defaults.exportName,
      renderMode: tool.view.renderMode ?? defaults.renderMode,
      runtime: tool.view.runtime ?? defaults.runtime,
      permissions: tool.view.permissions ?? defaults.permissions,
      domain: tool.view.domain ?? defaults.domain,
      prefersBorder: tool.view.prefersBorder ?? defaults.prefersBorder,
      capabilities: tool.view.capabilities ?? defaults.capabilities,
      csp:
        defaults.csp || tool.view.csp
          ? { ...defaults.csp, ...tool.view.csp }
          : undefined,
    };
    tool = { ...tool, view };
  }
  const legacyView =
    tool.module !== undefined
      ? {
          module: tool.module,
          exportName: tool.exportName ?? 'default',
          renderMode: tool.renderMode ?? 'component',
        }
      : undefined;
  const explicitView = tool.view
    ? {
        module: tool.view.module,
        exportName: tool.view.exportName ?? 'default',
        renderMode: tool.view.renderMode ?? 'component',
        runtime: tool.view.runtime,
        html: tool.view.html,
        assetBase: tool.view.assetBase,
        csp: tool.view.csp,
        permissions: tool.view.permissions,
        domain: tool.view.domain,
        prefersBorder: tool.view.prefersBorder,
        capabilities: tool.view.capabilities,
      }
    : undefined;
  const handler =
    typeof tool.handler === 'function'
      ? tool.handler
      : tool.handler
        ? {
            module: tool.handler.module,
            exportName: tool.handler.exportName ?? 'default',
            runtime: tool.handler.runtime ?? 'local',
            timeoutMs: tool.handler.timeoutMs,
          }
        : undefined;

  return {
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: normalizeInputSchema(tool.inputSchema),
    outputSchema: tool.outputSchema,
    annotations: tool.annotations,
    _meta: tool._meta,
    remote: tool.remote,
    view: explicitView ?? legacyView,
    handler,
    visibility: tool.visibility,
  };
}
