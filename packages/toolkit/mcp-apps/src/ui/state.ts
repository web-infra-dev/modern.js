import type { CallToolResult } from '@modelcontextprotocol/server';
export interface ViewState {
  result?: CallToolResult;
  cancelled: boolean;
  tornDown?: boolean;
}
export type ViewEvent =
  | { type: 'input'; keepResult?: boolean }
  | { type: 'cancelled' | 'teardown' }
  | { type: 'result'; result: CallToolResult };
export function reduceViewState(state: ViewState, event: ViewEvent): ViewState {
  if (state.tornDown) return state;
  if (event.type === 'result')
    return { result: event.result, cancelled: false };
  if (event.type === 'teardown') return { cancelled: false, tornDown: true };
  if (event.type === 'input' && event.keepResult)
    return { ...state, cancelled: false };
  return { cancelled: event.type === 'cancelled' };
}
export function resultProps(result?: CallToolResult): Record<string, unknown> {
  const output = result?.isError ? undefined : result?.structuredContent;
  return output && typeof output === 'object' && !Array.isArray(output)
    ? (output as Record<string, unknown>)
    : {};
}
