/** Versioned Modern.js metadata. Business output stays in structuredContent. */
export const MCP_VIEW_META_KEY = 'modernjs.dev/mcp-app';

export interface McpViewMetadata {
  version: 1;
  tool?: string;
  resource?: unknown;
  args?: Record<string, unknown>;
  viewProps?: Record<string, unknown>;
}

export interface ViewResult {
  structuredContent?: unknown;
  _meta?: Record<string, unknown>;
  content?: Array<{ type: string; text?: string }>;
  isError?: boolean;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function metadata(value: unknown): McpViewMetadata | undefined {
  const data = record(value);
  if (!data) return;
  return {
    version: 1,
    tool: typeof data.tool === 'string' ? data.tool : undefined,
    resource: data.resource ?? record(data.config)?.resource,
    args: record(data.args),
    viewProps: record(data.viewProps),
  };
}

/** Prefer versioned metadata. Read old Modern.js results for rolling upgrades. */
export function readMcpViewResult(
  result?: ViewResult,
): McpViewMetadata | undefined {
  if (!result) return;
  if (result._meta && Object.hasOwn(result._meta, MCP_VIEW_META_KEY)) {
    const data = record(result._meta[MCP_VIEW_META_KEY]);
    return data?.version === 1 ? metadata(data) : undefined;
  }
  const legacy = record(result.structuredContent);
  if (legacy && ('args' in legacy || 'viewProps' in legacy)) {
    return metadata(legacy);
  }
  for (const item of result.content ?? []) {
    if (item.type !== 'text' || !item.text) continue;
    try {
      const data = record(JSON.parse(item.text));
      if (data?.tool && (data.resource || record(data.config)?.resource)) {
        return metadata(data);
      }
    } catch {
      // Human-readable text is not a legacy rendering payload.
    }
  }
}

export function mergeMcpViewProps(
  input?: Record<string, unknown>,
  partialInput?: Record<string, unknown>,
  result?: ViewResult,
) {
  const output = readMcpViewResult(result);
  return { ...partialInput, ...input, ...output?.args, ...output?.viewProps };
}

export interface McpToolState {
  input?: Record<string, unknown>;
  partialInput?: Record<string, unknown>;
  result?: ViewResult;
  resource?: unknown;
  cancelled: boolean;
}

export type McpToolEvent =
  | { type: 'input' | 'partial'; arguments?: Record<string, unknown> }
  | { type: 'result'; result: ViewResult }
  | { type: 'cancelled' }
  | { type: 'teardown' };

/** Keep the loaded resource across inputs, but never reuse previous result props. */
export function reduceMcpToolState(
  state: McpToolState,
  event: McpToolEvent,
): McpToolState {
  switch (event.type) {
    case 'input':
      return {
        resource: state.resource,
        input: event.arguments,
        cancelled: false,
      };
    case 'partial':
      return {
        resource: state.resource,
        partialInput: event.arguments,
        cancelled: false,
      };
    case 'result':
      return {
        ...state,
        result: event.result,
        resource: readMcpViewResult(event.result)?.resource ?? state.resource,
        cancelled: false,
      };
    case 'cancelled':
      return { resource: state.resource, cancelled: true };
    case 'teardown':
      return { cancelled: false };
  }
}
