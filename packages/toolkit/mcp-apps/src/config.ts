import type { McpUiResourceMeta } from '@modelcontextprotocol/ext-apps';
import type {
  CallToolResult,
  ToolAnnotations,
} from '@modelcontextprotocol/sdk/types.js';

export interface McpAppsConfig {
  remotes: RemoteConfig[];
  tools: ToolConfig[];
}

export interface RemoteConfig {
  name: string;
  description?: string;
  version?: string;
  baseUrl: string;
  browserEntry?: string;
  serverEntry?: string;
  manifestType?: 'vmok' | 'mf';
  snapshotUrl?: string;
  locale?: string;
  csp?: {
    connectDomains?: string[];
    resourceDomains?: string[];
    frameDomains?: string[];
    baseUriDomains?: string[];
  };
  permissions?: McpUiResourceMeta['permissions'];
  domain?: string;
  prefersBorder?: boolean;
}

export interface ToolConfig {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: JsonSchema;
  outputSchema?: JsonSchema;
  annotations?: ToolAnnotations;
  remote?: string;
  module?: string;
  exportName?: string;
  renderMode?: RenderMode;
  view?: McpAppsViewConfig;
  handler?: McpAppsHandlerConfig | RemoteToolHandler;
  visibility?: Array<'model' | 'app'>;
}

export type JsonSchema = Record<string, unknown>;
export type RenderMode = 'component' | 'mount';

export interface McpAppsViewConfig {
  module: string;
  exportName?: string;
  renderMode?: RenderMode;
  runtime?: 'browser';
  /** Compiled HTML path, or an independently hosted HTTPS HTML resource. */
  html?: string;
  /** Base for application assets; "request" uses the public MCP request origin. */
  assetBase?: string;
  csp?: RemoteConfig['csp'];
}

export interface McpAppsHandlerConfig {
  module: string;
  exportName?: string;
  runtime?: 'local' | 'vmok-server';
  timeoutMs?: number;
}

export interface NormalizedToolConfig {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: JsonSchema;
  outputSchema?: JsonSchema;
  annotations?: ToolAnnotations;
  remote?: string;
  view?: Required<
    Pick<McpAppsViewConfig, 'module' | 'exportName' | 'renderMode'>
  > &
    Pick<McpAppsViewConfig, 'runtime' | 'html' | 'csp' | 'assetBase'>;
  handler?:
    | RemoteToolHandler
    | (Required<Pick<McpAppsHandlerConfig, 'module' | 'exportName'>> &
        Pick<McpAppsHandlerConfig, 'runtime' | 'timeoutMs'>);
  visibility?: Array<'model' | 'app'>;
}

export interface McpAppsDefinition {
  remotes: RemoteConfig[];
  tools: ToolConfig[];
}

export interface RemoteToolHandlerContext {
  toolName: string;
  remoteName?: string;
  remote?: RemoteConfig;
  handler?: Required<Pick<McpAppsHandlerConfig, 'module' | 'exportName'>> &
    Pick<McpAppsHandlerConfig, 'runtime' | 'timeoutMs'>;
  extra: unknown;
  signal: AbortSignal;
  fetch: typeof fetch;
  fetchJson: <T = unknown>(
    url: string,
    init?: Omit<RequestInit, 'body'> & { body?: unknown },
  ) => Promise<T>;
  serverUrl?: string;
  request: Request;
  context: unknown;
}

export interface RemoteToolHandlerResult {
  content?: CallToolResult['content'];
  structuredContent?: Record<string, unknown>;
  _meta?: Record<string, unknown>;
  viewProps?: Record<string, unknown>;
  isError?: boolean;
}

export type RemoteToolHandler = (
  input: unknown,
  context: RemoteToolHandlerContext,
) => Promise<RemoteToolHandlerResult> | RemoteToolHandlerResult;

export interface LoadRemoteHandlerOptions {
  remote?: RemoteConfig;
  handler: Required<Pick<McpAppsHandlerConfig, 'module' | 'exportName'>> &
    Pick<McpAppsHandlerConfig, 'runtime' | 'timeoutMs'>;
  configPath?: string;
}

export type LoadRemoteHandler = (
  options: LoadRemoteHandlerOptions,
) => Promise<RemoteToolHandler>;

export function defineMcpApps<T extends McpAppsDefinition>(definition: T): T {
  return definition;
}
