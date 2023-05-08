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
import {
  type UNSAFE_DeferredData as DeferredData,
  type TrackedPromise,
} from '@modern-js/utils/runtime';
import { serializeJson } from '@modern-js/utils/runtime-node';

function isTrackedPromise(value: any): value is TrackedPromise {
  return (
    value != null && typeof value.then === 'function' && value._tracked === true
  );
}

const DEFERRED_VALUE_PLACEHOLDER_PREFIX = '__deferred_promise:';
export function createDeferredReadableStream(
  deferredData: DeferredData,
  signal: AbortSignal,
): any {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller: any) {
      const criticalData: any = {};

      const preresolvedKeys: string[] = [];
      for (const [key, value] of Object.entries(deferredData.data)) {
        if (isTrackedPromise(value)) {
          criticalData[key] = `${DEFERRED_VALUE_PLACEHOLDER_PREFIX}${key}`;
          if (
            typeof value._data !== 'undefined' ||
            typeof value._error !== 'undefined'
          ) {
            preresolvedKeys.push(key);
          }
        } else {
          criticalData[key] = value;
        }
      }

      // Send the critical data
      controller.enqueue(encoder.encode(`${JSON.stringify(criticalData)}\n\n`));

      for (const preresolvedKey of preresolvedKeys) {
        enqueueTrackedPromise(
          controller,
          encoder,
          preresolvedKey,
          deferredData.data[preresolvedKey] as TrackedPromise,
        );
      }

      const unsubscribe = deferredData.subscribe((aborted, settledKey) => {
        if (settledKey) {
          enqueueTrackedPromise(
            controller,
            encoder,
            settledKey,
            deferredData.data[settledKey] as TrackedPromise,
          );
        }
      });
      await deferredData.resolveData(signal);
      unsubscribe();
      controller.close();
    },
  });

  return stream;
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
