import type {
  NormalizedToolConfig,
  RemoteConfig,
  RemoteToolHandlerResult,
  ToolConfig,
} from './config';
const RESOURCE_MIME_TYPE = 'text/html;profile=mcp-app';

export function normalizeToolConfig(tool: ToolConfig): NormalizedToolConfig {
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
    inputSchema: tool.inputSchema,
    outputSchema: tool.outputSchema,
    annotations: tool.annotations,
    remote: tool.remote,
    view: explicitView ?? legacyView,
    handler,
    visibility: tool.visibility,
  };
}

export function createMcpAppsViewResource({
  remote,
  toolConfig,
  resourceUri,
  serverUrl,
}: {
  remote?: RemoteConfig;
  toolConfig: NormalizedToolConfig;
  resourceUri: string;
  serverUrl?: string;
}) {
  if (!toolConfig.view) {
    return undefined;
  }
  if (!remote)
    return {
      mimeType: RESOURCE_MIME_TYPE,
      resourceUri,
      csp: toolConfig.view.csp,
    };
  return {
    mimeType: RESOURCE_MIME_TYPE,
    moduleFederation: {
      remoteName: toolConfig.remote,
      remoteEntry: remote.browserEntry ?? remote.baseUrl,
      snapshotUrl: remote.snapshotUrl,
      module: toolConfig.view.module,
      exportName: toolConfig.view.exportName,
      renderMode: toolConfig.view.renderMode,
      manifestType: remote.manifestType ?? 'vmok',
      mcpServerUrl: serverUrl,
      resourceUri,
    },
    csp: remote.csp,
  };
}

export function createStaticMcpAppsToolResult({
  toolName,
  resource,
  args,
}: {
  toolName: string;
  resource: NonNullable<ReturnType<typeof createMcpAppsViewResource>>;
  args: unknown;
}) {
  const payload = { tool: toolName, resource, args };
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload) }],
    structuredContent: payload,
  };
}

export async function fetchJson<T = unknown>(
  url: string,
  init: Omit<RequestInit, 'body'> & { body?: unknown } = {},
): Promise<T> {
  const { body, headers, ...rest } = init;
  const response = await fetch(url, {
    ...rest,
    headers: {
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body:
      body !== undefined && typeof body !== 'string'
        ? JSON.stringify(body)
        : body,
  });
  if (!response.ok) {
    throw new Error(
      `${url}: request failed (${response.status} ${response.statusText})`,
    );
  }
  return (await response.json()) as T;
}

export function mergeHandlerResultWithView({
  toolName,
  args,
  resource,
  handlerResult,
}: {
  toolName: string;
  args: unknown;
  resource?: ReturnType<typeof createMcpAppsViewResource>;
  handlerResult: RemoteToolHandlerResult;
}) {
  const structuredContent = {
    ...(handlerResult.structuredContent ?? {}),
    ...(resource
      ? {
          tool: toolName,
          resource,
          args,
          ...(handlerResult.viewProps
            ? { viewProps: handlerResult.viewProps }
            : {}),
        }
      : {}),
  };
  const content =
    handlerResult.content ??
    (resource
      ? [
          {
            type: 'text' as const,
            text: JSON.stringify({ tool: toolName, resource, args }),
          },
        ]
      : []);

  return {
    content,
    structuredContent,
    ...(handlerResult._meta ? { _meta: handlerResult._meta } : {}),
    ...(handlerResult.isError ? { isError: true } : {}),
  };
}
