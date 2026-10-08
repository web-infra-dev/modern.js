import { AsyncLocalStorage } from 'node:async_hooks';
import type { SSRRequestWork } from '../../types/requestHandler';
export type { SSRRequestWork } from '../../types/requestHandler';

export interface SSRRequestCoordinatorOptions {
  maxPendingRequests: number;
  requestTimeoutMs: number;
  drainTimeoutMs: number;
  /** Evaluated before SSR admission. Must be synchronous and must not submit updates. */
  requestPolicy?: SSRRequestPolicy;
  /** Maximum queued requests released together after an update. Defaults to 8. */
  maxResumeConcurrency?: number;
  /** Bounds deferred submissions, including those awaiting response completion. Defaults to 32. */
  maxPendingUpdates?: number;
}

export type SSRUpdatePhase =
  | 'serving'
  | 'draining'
  | 'updating'
  | 'unavailable';
export type SSRRequestPolicyDecision = 'wait' | 'csr' | 'reject';
export type SSRRequestPolicyReason =
  | 'updating'
  | 'unavailable'
  | 'timeout'
  | 'queue-full';
export interface SSRRequestPolicyContext {
  readonly request: Request;
  readonly update: Readonly<{
    phase: SSRUpdatePhase;
    generation: number;
    affectedEntries: readonly string[] | undefined;
    activeRequests: number;
    pendingRequests: number;
    waitedMs: number;
    reason: SSRRequestPolicyReason;
  }>;
}
export type SSRRequestPolicy =
  | SSRRequestPolicyDecision
  | ((context: SSRRequestPolicyContext) => SSRRequestPolicyDecision);
export interface SSRDeferredUpdate<T> {
  readonly accepted: true;
  /** Do not await this from the submitting SSR request: it completes after that request. */
  readonly completed: Promise<T>;
}
export type SSRRequestScope = readonly string[] | undefined;
type Waiter = {
  scope: SSRRequestScope;
  resume: (release: () => void) => void;
  reject: (reason: Error) => void;
};

const intersects = (left: SSRRequestScope, right: SSRRequestScope) =>
  !left || !right || left.some(scope => right.includes(scope));

const copyScope = (scope: SSRRequestScope): SSRRequestScope => {
  if (scope === undefined) return;
  if (
    !Array.isArray(scope) ||
    !scope.length ||
    scope.some(value => typeof value !== 'string' || !value)
  )
    throw new TypeError('SSR scope must contain non-empty entry names');
  return [...new Set(scope)];
};

class AdmissionError extends Error {
  constructor(
    message: string,
    readonly reason: SSRRequestPolicyReason,
  ) {
    super(message);
  }
}

/**
 * Node application-owner primitive. It must wrap resource/handler selection, not
 * an already captured renderer. Stream producers must register outstanding work.
 * This does not automatically integrate arbitrary renderers or drain side effects.
 */
export function createSSRRequestCoordinator(
  options: SSRRequestCoordinatorOptions,
) {
  const {
    maxPendingRequests,
    requestTimeoutMs,
    drainTimeoutMs,
    maxResumeConcurrency = 8,
    maxPendingUpdates = 32,
  } = options;
  if (!Number.isSafeInteger(maxPendingRequests) || maxPendingRequests < 0)
    throw new Error('maxPendingRequests must be a non-negative safe integer');
  if (!Number.isSafeInteger(maxPendingUpdates) || maxPendingUpdates < 0)
    throw new Error('maxPendingUpdates must be a non-negative safe integer');
  if (!Number.isSafeInteger(maxResumeConcurrency) || maxResumeConcurrency < 1)
    throw new Error('maxResumeConcurrency must be a positive safe integer');
  for (const timeout of [requestTimeoutMs, drainTimeoutMs]) {
    if (!Number.isFinite(timeout) || timeout <= 0 || timeout > 2_147_483_647)
      throw new Error(
        'Coordinator timeouts must be positive finite timer durations',
      );
  }
  const context = new AsyncLocalStorage<{
    active: boolean;
    updating?: boolean;
    completion?: Promise<void>;
  }>();
  const waiters = new Set<Waiter>();
  const drainListeners = new Set<() => void>();
  let phase: SSRUpdatePhase = 'serving';
  let active = 0;
  let resumed = 0;
  let pendingUpdates = 0;
  let evaluatingPolicy = false;
  let closedScope: SSRRequestScope;
  const leases = new Map<object, SSRRequestScope>();
  const blocked = (scope: SSRRequestScope) =>
    phase !== 'serving' && intersects(scope, closedScope);
  let generation = 0;
  let updates: Promise<unknown> = Promise.resolve();
  let deferredUpdates: Promise<unknown> = Promise.resolve();

  const wake = (error?: Error) => {
    for (const waiter of Array.from(waiters)) {
      if (error && blocked(waiter.scope)) waiter.reject(error);
      else if (!blocked(waiter.scope) && resumed < maxResumeConcurrency) {
        resumed++;
        let released = false;
        waiter.resume(() => {
          if (released) return;
          released = true;
          resumed--;
          wake();
        });
      }
    }
  };

  const waitForAdmission = (
    signal: AbortSignal,
    deadline: number,
    scope: SSRRequestScope,
  ) =>
    new Promise<() => void>((resolve, reject) => {
      if (signal.aborted) return reject(signal.reason);
      if (phase === 'unavailable' && blocked(scope))
        return reject(
          new AdmissionError('SSR application is unavailable', 'unavailable'),
        );
      if (waiters.size >= maxPendingRequests)
        return reject(
          new AdmissionError('SSR request queue is full', 'queue-full'),
        );
      const remaining = deadline - Date.now();
      if (remaining <= 0)
        return reject(
          new AdmissionError('SSR request wait timed out', 'timeout'),
        );
      const finish = (error?: unknown, release?: () => void) => {
        clearTimeout(timer);
        waiters.delete(waiter);
        signal.removeEventListener('abort', abort);
        if (error !== undefined) reject(error);
        else resolve(release!);
      };
      const abort = () => finish(signal.reason);
      const waiter: Waiter = {
        scope,
        resume: release => finish(undefined, release),
        reject: finish,
      };
      const timer = setTimeout(
        () =>
          finish(new AdmissionError('SSR request wait timed out', 'timeout')),
        remaining,
      );
      waiters.add(waiter);
      signal.addEventListener('abort', abort, { once: true });
    });

  const drain = () =>
    new Promise<void>((resolve, reject) => {
      const drained = () =>
        !Array.from(leases.values()).some(scope =>
          intersects(scope, closedScope),
        );
      if (drained()) return resolve();
      const finish = () => {
        if (!drained()) return;
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

  const rejectRequest = (message: string) =>
    new Response(message, { status: 503, headers: { 'Retry-After': '1' } });

  const decide = (
    request: Request,
    started: number,
    reason: SSRRequestPolicyReason,
  ) => {
    const policyContext: SSRRequestPolicyContext = Object.freeze({
      request,
      update: Object.freeze({
        phase,
        generation,
        affectedEntries:
          phase === 'serving'
            ? Object.freeze([])
            : closedScope && Object.freeze([...closedScope]),
        activeRequests: active,
        pendingRequests: waiters.size,
        waitedMs: Math.max(0, Date.now() - started),
        reason,
      }),
    });
    let decision: SSRRequestPolicyDecision = 'reject';
    evaluatingPolicy = true;
    try {
      const policy = options.requestPolicy ?? 'wait';
      const result: unknown =
        typeof policy === 'function' ? policy(policyContext) : policy;
      if (result === 'wait' || result === 'csr' || result === 'reject')
        decision = result;
      // Invalid async policies still fail closed without unhandled rejections.
      else void Promise.resolve(result).catch(() => {});
    } catch {
      // A broken policy must never admit an unsafe renderer.
    } finally {
      evaluatingPolicy = false;
    }
    return { decision, policyContext };
  };

  const assertUpdateAllowed = () => {
    if (evaluatingPolicy)
      throw new Error('Cannot update SSR from an admission policy');
    if (context.getStore()?.active)
      throw new Error(
        context.getStore()?.updating
          ? 'Cannot nest SSR updates'
          : 'Cannot update SSR from a request being drained',
      );
  };

  return {
    get status() {
      return {
        phase,
        closedScope: phase === 'serving' ? [] : closedScope && [...closedScope],
        generation,
        activeRequests: active,
        pendingRequests: waiters.size,
        pendingUpdates,
      };
    },

    assertUpdateAllowed,

    /** Accept work now and execute it outside the request after its complete lease settles. */
    defer<T>(operation: () => Promise<T>): SSRDeferredUpdate<T> {
      if (typeof operation !== 'function')
        throw new TypeError('A deferred update operation is required');
      if (evaluatingPolicy)
        throw new Error('Cannot submit SSR updates from an admission policy');
      const owner = context.getStore();
      if (owner?.active && owner.updating)
        throw new Error('Cannot defer a nested SSR update');
      if (pendingUpdates >= maxPendingUpdates)
        throw new Error('SSR deferred update queue is full');
      pendingUpdates++;
      const completion = owner?.active ? owner.completion : undefined;
      const completed = context.exit(() =>
        deferredUpdates.then(() => completion).then(operation),
      );
      // Observe failures even when the caller only needs an acceptance receipt.
      // The original promise still preserves the operation's success/failure.
      deferredUpdates = completed.then(
        () => {
          pendingUpdates--;
        },
        () => {
          pendingUpdates--;
        },
      );
      return Object.freeze({ accepted: true, completed });
    },

    async handle(
      request: Request,
      render: (work: SSRRequestWork) => Promise<Response>,
      requestScope?: readonly string[],
      renderCSR?: (context: SSRRequestPolicyContext) => Promise<Response>,
    ): Promise<Response> {
      if (
        context.getStore()?.active &&
        (context.getStore()?.updating || phase !== 'serving')
      )
        throw new Error(
          'Cannot wait on SSR admission from its active request or update',
        );
      const scope = copyScope(requestScope);
      const started = Date.now();
      const deadline = started + requestTimeoutMs;
      let releaseAdmission: (() => void) | undefined;
      const respond = (reason: SSRRequestPolicyReason, message: string) => {
        const { decision, policyContext } = decide(request, started, reason);
        return decision === 'csr' && renderCSR
          ? renderCSR(policyContext)
          : rejectRequest(message);
      };
      try {
        request.signal.throwIfAborted();
        // Waking is only a notification: another update may have closed admission.
        while (blocked(scope)) {
          const reason = phase === 'unavailable' ? 'unavailable' : 'updating';
          const { decision, policyContext } = decide(request, started, reason);
          if (decision === 'csr' && renderCSR) return renderCSR(policyContext);
          if (decision !== 'wait' || reason === 'unavailable')
            return rejectRequest('SSR application is unavailable');
          releaseAdmission = await waitForAdmission(
            request.signal,
            deadline,
            scope,
          );
          if (blocked(scope)) {
            releaseAdmission();
            releaseAdmission = undefined;
          }
        }
        request.signal.throwIfAborted();
      } catch (error) {
        releaseAdmission?.();
        if (error instanceof AdmissionError)
          return respond(error.reason, error.message);
        throw error;
      }
      // No await between checking admission and acquiring the lease.
      active++;
      let settle!: () => void;
      const lease = {
        active: true,
        completion: new Promise<void>(resolve => {
          settle = resolve;
        }),
      };
      leases.set(lease, scope);
      let pending = 1;
      const release = () => {
        if (--pending !== 0) return;
        lease.active = false;
        active--;
        leases.delete(lease);
        for (const finish of Array.from(drainListeners)) finish();
        releaseAdmission?.();
        settle();
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
    update(
      publish: (scope: SSRRequestScope) => Promise<void>,
      requestedScope?: readonly string[] | (() => SSRRequestScope),
    ): Promise<number> {
      let scope: SSRRequestScope;
      try {
        assertUpdateAllowed();
        scope =
          typeof requestedScope === 'function'
            ? undefined
            : copyScope(requestedScope);
      } catch (error) {
        return Promise.reject(error);
      }
      const operation = updates.then(async () => {
        if (typeof requestedScope === 'function')
          scope = copyScope(requestedScope());
        const previous = phase;
        const previousScope = closedScope;
        // A failed mutation must be repaired before its scope can reopen.
        closedScope = previous === 'unavailable' ? undefined : scope;
        phase = 'draining';
        try {
          await drain();
        } catch (error) {
          phase = previous;
          closedScope = previousScope;
          wake();
          throw error;
        }
        phase = 'updating';
        const publication = { active: true, updating: true };
        try {
          await context.run(publication, () => publish(closedScope));
          generation++;
          phase = 'serving';
          wake();
          return generation;
        } catch (error) {
          phase = 'unavailable';
          wake(
            new AdmissionError('SSR application update failed', 'unavailable'),
          );
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
