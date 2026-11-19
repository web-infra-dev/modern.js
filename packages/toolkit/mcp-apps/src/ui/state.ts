import type { CallToolResult } from '@modelcontextprotocol/server';
export interface ViewState {
  result?: CallToolResult;
  cancelled: boolean;
}
export type ViewEvent =
  | { type: 'input' | 'cancelled' | 'teardown' }
  | { type: 'result'; result: CallToolResult };
export function reduceViewState(
  _state: ViewState,
  event: ViewEvent,
): ViewState {
  if (event.type === 'result')
    return { result: event.result, cancelled: false };
  return { cancelled: event.type === 'cancelled' };
}
export function resultProps(result?: CallToolResult): Record<string, unknown> {
  const output = result?.isError ? undefined : result?.structuredContent;
  return output && typeof output === 'object' && !Array.isArray(output)
    ? (output as Record<string, unknown>)
    : {};
}
