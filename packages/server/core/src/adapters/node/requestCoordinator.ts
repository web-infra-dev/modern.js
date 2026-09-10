import { AsyncLocalStorage } from 'node:async_hooks';
import type { SSRRequestWork } from '../../types/requestHandler';
export type { SSRRequestWork } from '../../types/requestHandler';

export interface SSRRequestCoordinatorOptions {
  maxPendingRequests: number;
  requestTimeoutMs: number;
  drainTimeoutMs: number;
}

type Phase = 'serving' | 'draining' | 'updating' | 'unavailable';
type Waiter = { resume: () => void; reject: (reason: Error) => void };

class AdmissionError extends Error {}

/**
 * Node application-owner primitive. It must wrap resource/handler selection, not
 * an already captured renderer. Stream producers must register outstanding work.
 * This does not automatically integrate arbitrary renderers or drain side effects.
 */
export function createSSRRequestCoordinator(
  options: SSRRequestCoordinatorOptions,
) {
  const { maxPendingRequests, requestTimeoutMs, drainTimeoutMs } = options;
  if (!Number.isSafeInteger(maxPendingRequests) || maxPendingRequests < 0)
    throw new Error('maxPendingRequests must be a non-negative safe integer');
  for (const timeout of [requestTimeoutMs, drainTimeoutMs]) {
    if (!Number.isFinite(timeout) || timeout <= 0 || timeout > 2_147_483_647)
      throw new Error(
        'Coordinator timeouts must be positive finite timer durations',
      );
  }
  const context = new AsyncLocalStorage<{
    active: boolean;
    updating?: boolean;
  }>();
  const waiters = new Set<Waiter>();
  const drainListeners = new Set<() => void>();
  let phase: Phase = 'serving';
  let active = 0;
  let generation = 0;
  let updates: Promise<unknown> = Promise.resolve();

  const wake = (error?: Error) => {
    for (const waiter of Array.from(waiters)) {
      if (error) waiter.reject(error);
      else waiter.resume();
    }
  };

  const waitForAdmission = (signal: AbortSignal, deadline: number) =>
    new Promise<void>((resolve, reject) => {
      if (signal.aborted) return reject(signal.reason);
      if (phase === 'unavailable')
        return reject(new AdmissionError('SSR application is unavailable'));
      if (waiters.size >= maxPendingRequests)
        return reject(new AdmissionError('SSR request queue is full'));
      const remaining = deadline - Date.now();
      if (remaining <= 0)
        return reject(new AdmissionError('SSR request wait timed out'));
      const finish = (error?: unknown) => {
        clearTimeout(timer);
        waiters.delete(waiter);
        signal.removeEventListener('abort', abort);
        if (error !== undefined) reject(error);
        else resolve();
      };
      const abort = () => finish(signal.reason);
      const waiter: Waiter = { resume: () => finish(), reject: finish };
      const timer = setTimeout(
        () => finish(new AdmissionError('SSR request wait timed out')),
        remaining,
      );
      waiters.add(waiter);
      signal.addEventListener('abort', abort, { once: true });
    });

  const drain = () =>
    new Promise<void>((resolve, reject) => {
      if (active === 0) return resolve();
      const finish = () => {
        clearTimeout(timer);
        drainListeners.delete(finish);
        resolve();
      };
      const timer = setTimeout(() => {
        drainListeners.delete(finish);
        reject(new Error('SSR drain timed out before mutation'));
      }, drainTimeoutMs);
      drainListeners.add(finish);
    });

  return {
    get status() {
      return {
        phase,
        generation,
        activeRequests: active,
        pendingRequests: waiters.size,
      };
    },

    async handle(
      request: Request,
      render: (work: SSRRequestWork) => Promise<Response>,
    ): Promise<Response> {
      if (
        context.getStore()?.active &&
        (context.getStore()?.updating || phase !== 'serving')
      )
        throw new Error(
          'Cannot wait on SSR admission from its active request or update',
        );
      const deadline = Date.now() + requestTimeoutMs;
      try {
        // Waking is only a notification: another update may have closed admission.
        while (phase !== 'serving')
          await waitForAdmission(request.signal, deadline);
        request.signal.throwIfAborted();
      } catch (error) {
        if (error instanceof AdmissionError)
          return new Response(error.message, {
            status: 503,
            headers: { 'Retry-After': '1' },
          });
        throw error;
      }
      // No await between checking admission and acquiring the lease.
      active++;
      const lease = { active: true };
      let pending = 1;
      const release = () => {
        if (--pending !== 0) return;
        lease.active = false;
        active--;
        if (active === 0)
          for (const finish of Array.from(drainListeners)) finish();
      };
      const work: SSRRequestWork = {
        track<T>(task: Promise<T>) {
          if (!lease.active)
            throw new Error('Cannot register work on a completed SSR request');
          pending++;
          // Both success and failure settle work; neither implies response success.
          task.then(release, release);
          return task;
        },
      };
      return context.run(lease, async () => {
        try {
          const response = await render(work);
          if (!response.body) return response;
          const reader = response.body.getReader();
          pending++;
          let ended = false;
          const finish = () => {
            if (ended) return;
            ended = true;
            request.signal.removeEventListener('abort', abort);
            release();
          };
          // Disconnect settles only transport ownership. Registered producer work
          // still holds the lease until its own cancellation/completion handshake.
          const abort = () => {
            void reader.cancel(request.signal.reason).then(finish, finish);
          };
          request.signal.addEventListener('abort', abort, { once: true });
          if (request.signal.aborted) abort();
          const body = new ReadableStream<Uint8Array>(
            {
              async pull(controller) {
                try {
                  const chunk = await reader.read();
                  if (chunk.done) {
                    controller.close();
                    finish();
                  } else controller.enqueue(chunk.value);
                } catch (error) {
                  controller.error(error);
                  finish();
                }
              },
              async cancel(reason) {
                try {
                  await reader.cancel(reason);
                } finally {
                  finish();
                }
              },
            },
            { highWaterMark: 0 },
          );
          return new Response(body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        } finally {
          release();
        }
      });
    },

    /** Serialize updates. A mutation failure stays closed; retry explicitly. */
    update(publish: () => Promise<void>): Promise<number> {
      if (context.getStore()?.active)
        return Promise.reject(
          new Error(
            context.getStore()?.updating
              ? 'Cannot nest SSR updates'
              : 'Cannot update SSR from a request being drained',
          ),
        );
      const operation = updates.then(async () => {
        const previous = phase;
        phase = 'draining';
        try {
          await drain();
        } catch (error) {
          phase = previous;
          if (phase === 'serving') wake();
          throw error;
        }
        phase = 'updating';
        const publication = { active: true, updating: true };
        try {
          await context.run(publication, publish);
          generation++;
          phase = 'serving';
          wake();
          return generation;
        } catch (error) {
          phase = 'unavailable';
          wake(new AdmissionError('SSR application update failed'));
          throw error;
        } finally {
          publication.active = false;
        }
      });
      updates = operation.catch(() => {});
      return operation;
    },
  };
}
