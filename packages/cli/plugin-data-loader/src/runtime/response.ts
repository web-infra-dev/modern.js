/**
 * The following code is modified based on
 * https://github.com/remix-run/remix/blob/2b5e1a72fc628d0408e27cf4d72e537762f1dc5b/packages/remix-server-runtime/responses.ts
 *
 * MIT Licensed
 * Author Michael Jackson
 * Copyright 2021 Remix Software Inc.
 * https://github.com/remix-run/remix/blob/2b5e1a72fc628d0408e27cf4d72e537762f1dc5b/LICENSE.md
 */
import { TextEncoder } from 'util';
import type {
  DeferredData,
  TrackedPromise,
} from '@modern-js/runtime-utils/browser';
import { serializeJson } from '@modern-js/runtime-utils/node';
import type { SSRRequestWork } from '@modern-js/server-core/node';

function isTrackedPromise(value: any): value is TrackedPromise {
  return (
    value != null && typeof value.then === 'function' && value._tracked === true
  );
}

const DEFERRED_VALUE_PLACEHOLDER_PREFIX = '__deferred_promise:';
export function createDeferredReadableStream(
  deferredData: DeferredData,
  signal: AbortSignal,
  work?: SSRRequestWork,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let cancel = () => {};
  return new ReadableStream<Uint8Array>({
    start(controller) {
      let settle!: () => void;
      const completion = new Promise<void>(resolve => {
        settle = resolve;
      });
      work?.track(completion);
      let ended = false;
      let unsubscribe = () => {};
      const finish = () => {
        if (ended) return;
        ended = true;
        unsubscribe();
        signal.removeEventListener('abort', abort);
        settle();
      };
      const fail = (reason: unknown) => {
        if (ended) return;
        finish();
        controller.error(reason);
        deferredData.cancel();
      };
      const abort = () => fail(signal.reason);
      cancel = () => {
        finish();
        deferredData.cancel();
      };
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) {
        abort();
        return;
      }
      try {
        const criticalData: Record<string, unknown> = {};
        const preresolvedKeys: string[] = [];
        for (const [key, value] of Object.entries(deferredData.data)) {
          if (isTrackedPromise(value)) {
            criticalData[key] = `${DEFERRED_VALUE_PLACEHOLDER_PREFIX}${key}`;
            if (
              typeof value._data !== 'undefined' ||
              typeof value._error !== 'undefined'
            )
              preresolvedKeys.push(key);
          } else criticalData[key] = value;
        }
        controller.enqueue(
          encoder.encode(`${JSON.stringify(criticalData)}\n\n`),
        );
        for (const key of preresolvedKeys)
          enqueueTrackedPromise(
            controller,
            encoder,
            key,
            deferredData.data[key] as TrackedPromise,
          );
        const update = (aborted: boolean, key?: string) => {
          if (ended) return;
          try {
            if (key)
              enqueueTrackedPromise(
                controller,
                encoder,
                key,
                deferredData.data[key] as TrackedPromise,
              );
            if (aborted || deferredData.done) {
              controller.close();
              finish();
            }
          } catch (error) {
            fail(error);
          }
        };
        unsubscribe = deferredData.subscribe(update);
        update(false);
      } catch (error) {
        fail(error);
      }
    },
    cancel() {
      cancel();
    },
  });
}

function enqueueTrackedPromise(
  controller: any,
  encoder: TextEncoder,
  settledKey: string,
  promise: TrackedPromise,
) {
  if ('_error' in promise) {
    const { _error } = promise;
    controller.enqueue(
      encoder.encode(
        `error:${serializeJson({
          [settledKey]: {
            message: _error.message,
            stack: _error.stack,
          },
        })}\n\n`,
      ),
    );
  } else {
    controller.enqueue(
      encoder.encode(
        `data:${JSON.stringify({ [settledKey]: promise._data ?? null })}\n\n`,
      ),
    );
  }
}
