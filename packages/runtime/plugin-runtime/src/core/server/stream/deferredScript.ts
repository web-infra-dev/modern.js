import type { DeferredData } from '@modern-js/runtime-utils/browser';
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
  const nonceAttr = nonce ? ` nonce=\"${nonce}\"` : '';
  return `<script async${nonceAttr} data-fn-name=\"r\" data-script-src=\"modern-run-router-data-fn\" data-fn-args='${escaped}' suppressHydrationWarning>${runRouterDataFnStr}</script>`;
}

export function enqueueFromEntries(
  entries: Array<[string, unknown]>,
  nonce: string | undefined,
  emit: (script: string) => void,
): void {
  entries.forEach(([routeId, value]) => {
    if (!isDeferredDataLike(value)) return;
    const pendingKeys = new Set<string>(value.pendingKeys ?? []);
    pendingKeys.forEach((key: string) => {
      const tracked = value.data?.[key];
      if (isPromiseLike(tracked)) {
        (tracked as Promise<unknown>).then(
          (val: unknown) =>
            emit(buildDeferredDataScript(nonce, [routeId, key, val])),
          (err: unknown) =>
            emit(
              buildDeferredDataScript(nonce, [
                routeId,
                key,
                undefined,
                toErrorInfo(err),
              ]),
            ),
        );
      }
    });
  });
}
