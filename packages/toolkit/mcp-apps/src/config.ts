import type { McpUiResourceMeta } from '@modelcontextprotocol/ext-apps';
import type {
  CallToolResult,
  ToolAnnotations,
} from '@modelcontextprotocol/server';
import type { InferSchema } from './tool';

export type McpAppsViewDefaults = Pick<
  McpAppsViewConfig,
  'assetBase' | 'csp' | 'exportName' | 'renderMode' | 'runtime'
>;

export interface McpAppsConfig {
  name?: string;
  version?: string;
  viewDefaults?: McpAppsViewDefaults;
  remotes: RemoteConfig[];
  tools: ToolConfig[];
}

export interface RemoteConfig {
  name: string;
  description?: string;
  baseUrl: string;
  browserEntry?: string;
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
  _meta?: Record<string, unknown>;
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
  runtime?: 'local';
  timeoutMs?: number;
}

export interface NormalizedToolConfig {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: JsonSchema;
  outputSchema?: JsonSchema;
  annotations?: ToolAnnotations;
  _meta?: Record<string, unknown>;
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
  name?: string;
  version?: string;
  viewDefaults?: McpAppsViewDefaults;
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
  structuredContent?: unknown;
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

export interface McpServerDefinition extends Omit<
  McpAppsDefinition,
  'remotes'
> {
  name: string;
  version: string;
  remotes?: RemoteConfig[];
}

type InlineTools<S extends unknown[]> = {
  [K in keyof S]: Omit<ToolConfig, 'inputSchema' | 'handler'> & {
    inputSchema?: S[K] & JsonSchema;
    handler?:
      | McpAppsHandlerConfig
      | ((
          input: InferSchema<S[K]>,
          context: RemoteToolHandlerContext,
        ) => RemoteToolHandlerResult | Promise<RemoteToolHandlerResult>);
  };
};

type ServerDefinition<T, S extends unknown[]> = T &
  McpServerDefinition & {
    remotes: RemoteConfig[];
    tools: {
      [K in keyof S]: {
        readonly $types?: {
          input: InferSchema<S[K]>;
          result: T extends { tools: infer U }
            ? K extends keyof U
              ? U[K] extends { handler: (...args: never[]) => infer R }
                ? Awaited<R>
                : unknown
              : unknown
            : unknown;
        };
      };
    };
  };

export function defineMcpServer<const S extends unknown[], const T>(
  definition: T &
    Omit<McpServerDefinition, 'tools'> & { tools: InlineTools<S> },
): ServerDefinition<T, S> {
  if (!definition.name.trim() || !definition.version.trim()) {
    throw new Error('MCP server name and version must be non-empty');
  }
  // Tool input/result markers exist only in types; handlers are unchanged at runtime.
  return {
    ...definition,
    remotes: definition.remotes ?? [],
  } as ServerDefinition<T, S>;
}

/** @deprecated Use defineMcpServer for new server definitions. */
export function defineMcpApps<T extends McpAppsDefinition>(definition: T): T {
  return definition;
}

export { defineTool } from './tool';
export type { InferSchema, InferToolInput, InferToolOutput } from './tool';

export interface McpUiDefinition {
  viewDefaults?: McpAppsViewDefaults;
  tools: Array<{
    name: string;
    view: McpAppsViewConfig;
  }>;
}

/** Declare local UI builds without importing server-side tool handlers. */
export function defineMcpUi(definition: McpUiDefinition): McpAppsDefinition {
  return { ...definition, remotes: [] };
}
