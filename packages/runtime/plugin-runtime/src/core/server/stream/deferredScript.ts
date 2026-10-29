import type { DeferredData } from '@modern-js/runtime-utils/browser';
import type {
  DeferredResult,
  DeferredResultInput,
} from '@modern-js/render/html';
import { subscribeDeferredResults } from '@modern-js/render/html';
import { runRouterDataFnStr } from '../../../router/runtime/constants';

export type DeferredDataLike = Pick<DeferredData, 'data' | 'pendingKeys'> & {
  data?: Record<string, unknown>;
  pendingKeys?: string[];
};

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeAttr(value: string): string {
  return value.replace(/[&<>"']/g, ch => HTML_ESCAPE_MAP[ch]);
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function isDeferredDataLike(v: unknown): v is DeferredDataLike {
  if (!isRecord(v)) return false;
  const hasPending =
    'pendingKeys' in v && Array.isArray((v as any).pendingKeys);
  const hasData = 'data' in v && isRecord((v as any).data);
  return hasPending && hasData;
}

export function isPromiseLike(value: unknown): value is Promise<unknown> {
  return !!value && typeof (value as { then?: unknown }).then === 'function';
}

export function toErrorInfo(error: unknown): {
  message: string;
  stack?: string;
} {
  if (error && typeof error === 'object') {
    const maybeMsg = (error as { message?: unknown }).message;
    const maybeStack = (error as { stack?: string }).stack;
    return {
      message:
        typeof maybeMsg === 'string' ? maybeMsg : String(maybeMsg ?? error),
      stack: process.env.NODE_ENV !== 'production' ? maybeStack : undefined,
    };
  }
  return { message: String(error) };
}

export function buildDeferredDataScript(
  nonce: string | undefined,
  args: unknown[],
): string {
  const payload = JSON.stringify(args);
  const escaped = escapeAttr(payload);
  const nonceAttr = nonce ? ` nonce="${nonce}"` : '';
  return `<script async${nonceAttr} data-fn-name="r" data-script-src="modern-run-router-data-fn" data-fn-args='${escaped}' suppressHydrationWarning>${runRouterDataFnStr}</script>`;
}

function getSerializedKeys(
  routeId: string,
  value: DeferredDataLike,
  deferredScriptKeys: Map<string, string[]> | undefined,
): string[] {
  return deferredScriptKeys
    ? (deferredScriptKeys.get(routeId) ?? [])
    : (value.pendingKeys ?? []);
}

/**
 * Whether `enqueueFromEntries` would emit any resolver script for `entries`.
 */
export function hasDeferredResolvers(
  entries: Array<[string, unknown]>,
  deferredScriptKeys: Map<string, string[]> | undefined,
): boolean {
  return getRouterDeferredResults(entries, deferredScriptKeys).length > 0;
}

/** Only the router knows which keys were declared in its initial scripts. */
export function getRouterDeferredResults(
  entries: Array<[string, unknown]>,
  deferredScriptKeys: Map<string, string[]> | undefined,
): DeferredResultInput[] {
  const results: DeferredResultInput[] = [];
  for (const [routeId, deferred] of entries) {
    if (!isDeferredDataLike(deferred)) continue;
    for (const key of getSerializedKeys(
      routeId,
      deferred,
      deferredScriptKeys,
    )) {
      const value = deferred.data?.[key];
      if (isPromiseLike(value)) results.push({ source: routeId, key, value });
    }
  }
  return results;
}

export function serializeRouterDeferredResult(
  result: DeferredResult,
  nonce?: string,
): string {
  return buildDeferredDataScript(
    nonce,
    result.status === 'fulfilled'
      ? [result.source, result.key, result.value]
      : [result.source, result.key, undefined, toErrorInfo(result.error)],
  );
}

export function enqueueFromEntries(
  entries: Array<[string, unknown]>,
  deferredScriptKeys: Map<string, string[]> | undefined,
  nonce: string | undefined,
  emit: (script: string) => void,
): Promise<void> {
  return subscribeDeferredResults(
    getRouterDeferredResults(entries, deferredScriptKeys),
    result => emit(serializeRouterDeferredResult(result, nonce)),
  );
}
