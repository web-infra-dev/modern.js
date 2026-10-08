import {
  type SSRDeferredUpdate,
  type SSRRequestCoordinatorOptions,
  type SSRRequestPolicyContext,
  createSSRRequestCoordinator,
} from '../../src/adapters/node/requestCoordinator';

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const tick = () => new Promise<void>(resolve => setImmediate(resolve));
const request = () => new Request('http://localhost/a');
const coordinator = (overrides: Partial<SSRRequestCoordinatorOptions> = {}) =>
  createSSRRequestCoordinator({
    maxPendingRequests: 4,
    requestTimeoutMs: 1000,
    drainTimeoutMs: 1000,
    ...overrides,
  });

it('chooses CSR from request metadata before leasing or selecting SSR resources', async () => {
  const seen: SSRRequestPolicyContext[] = [];
  const gate = coordinator({
    requestPolicy(context) {
      seen.push(context);
      return context.request.headers.get('x-render') === 'csr' ? 'csr' : 'wait';
    },
  });
  const publication = deferred();
  const update = gate.update(() => publication.promise, ['a']);
  await tick();
  const req = new Request('http://localhost/a?preview=1', {
    headers: { 'x-render': 'csr' },
  });
  let rendered = false;
  const response = await gate.handle(
    req,
    async () => {
      rendered = true;
      return new Response('unsafe');
    },
    ['a'],
    async context => {
      expect(context.request).toBe(req);
      expect(gate.status.activeRequests).toBe(0);
      expect(context.update).toMatchObject({
        phase: 'updating',
        reason: 'updating',
        generation: 0,
        affectedEntries: ['a'],
      });
      expect(Object.isFrozen(context.update)).toBe(true);
      expect(Object.isFrozen(context.update.affectedEntries)).toBe(true);
      return new Response('client shell');
    },
  );
  expect(await response.text()).toBe('client shell');
  expect(rendered).toBe(false);
  expect(gate.status.pendingRequests).toBe(0);
  expect(
    await (
      await gate.handle(request(), async () => new Response('b'), ['b'])
    ).text(),
  ).toBe('b');
  expect(seen).toHaveLength(1);
  publication.resolve();
  await update;
});

it('re-evaluates the policy on queue overflow and mutation failure', async () => {
  const seen: string[] = [];
  const gate = coordinator({
    maxPendingRequests: 1,
    requestPolicy({ update }) {
      seen.push(update.reason);
      return update.reason === 'updating' ? 'wait' : 'csr';
    },
  });
  const publication = deferred();
  const update = gate.update(() => publication.promise);
  const failed = expect(update).rejects.toThrow('publish failed');
  await tick();
  const render = async () => {
    throw new Error('SSR must remain closed');
  };
  const csr = async ({ update }: SSRRequestPolicyContext) =>
    new Response(update.reason);
  const waiting = gate.handle(request(), render, undefined, csr);
  expect(
    await (await gate.handle(request(), render, undefined, csr)).text(),
  ).toBe('queue-full');
  publication.reject(new Error('publish failed'));
  await failed;
  expect(await (await waiting).text()).toBe('unavailable');
  expect(seen).toEqual(['updating', 'updating', 'queue-full', 'unavailable']);
  expect(gate.status.activeRequests).toBe(0);
});

it('lets a timed out waiter choose CSR without cancelling the update', async () => {
  const gate = coordinator({
    requestTimeoutMs: 20,
    requestPolicy: ({ update }) =>
      update.reason === 'timeout' ? 'csr' : 'wait',
  });
  const publication = deferred();
  const update = gate.update(() => publication.promise);
  await tick();
  const response = await gate.handle(
    request(),
    async () => {
      throw new Error('SSR must remain closed');
    },
    undefined,
    async ({ update }) => {
      expect(update.waitedMs).toBeGreaterThanOrEqual(15);
      return new Response('fallback');
    },
  );
  expect(await response.text()).toBe('fallback');
  expect(gate.status.phase).toBe('updating');
  expect(gate.status.pendingRequests).toBe(0);
  publication.resolve();
  await update;
});

it('fails closed for missing CSR support, policy errors and invalid async policies', async () => {
  for (const policy of [
    'csr',
    () => {
      throw new Error('policy failed');
    },
    async () => 'wait',
    async () => {
      throw new Error('async policy failed');
    },
  ]) {
    const gate = coordinator({
      requestPolicy: policy as SSRRequestCoordinatorOptions['requestPolicy'],
    });
    const publication = deferred();
    const update = gate.update(() => publication.promise);
    await tick();
    const response = await gate.handle(request(), async () => {
      throw new Error('SSR must remain closed');
    });
    expect(response.status).toBe(503);
    publication.resolve();
    await update;
  }
});

it('releases waiting requests in FIFO order with bounded render concurrency', async () => {
  const gate = coordinator({ maxResumeConcurrency: 2 });
  const publication = deferred();
  const update = gate.update(() => publication.promise);
  await tick();
  const order: number[] = [];
  const requests = [1, 2, 3, 4].map(value =>
    gate.handle(request(), async () => {
      order.push(value);
      return new Response(String(value));
    }),
  );
  publication.resolve();
  await update;
  await tick();
  expect(order).toEqual([1, 2]);
  expect(gate.status.pendingRequests).toBe(2);
  expect(await (await requests[0]).text()).toBe('1');
  await tick();
  expect(order).toEqual([1, 2, 3]);
  expect(await (await requests[1]).text()).toBe('2');
  await tick();
  expect(order).toEqual([1, 2, 3, 4]);
  await (await requests[2]).text();
  await (await requests[3]).text();
  expect(gate.status.activeRequests).toBe(0);
});

it('defers updates outside request context until both response and producer work finish', async () => {
  const gate = coordinator();
  const producer = deferred();
  let submission!: SSRDeferredUpdate<number>;
  let published = false;
  const response = await gate.handle(request(), async work => {
    work.track(producer.promise);
    submission = gate.defer(() =>
      gate.update(async () => {
        published = true;
      }),
    );
    expect(submission.accepted).toBe(true);
    expect(() => gate.assertUpdateAllowed()).toThrow('request being drained');
    return new Response('old');
  });
  await tick();
  expect(published).toBe(false);
  expect(gate.status.phase).toBe('serving');
  expect(await response.text()).toBe('old');
  await tick();
  expect(published).toBe(false);
  expect(gate.status.pendingUpdates).toBe(1);
  producer.resolve();
  expect(await submission.completed).toBe(1);
  expect(published).toBe(true);
  expect(gate.status.activeRequests).toBe(0);
  expect(gate.status.pendingUpdates).toBe(0);
});

it('bounds deferred submissions and preserves failure outcomes without poisoning later work', async () => {
  const gate = coordinator({ maxPendingUpdates: 1 });
  let submission!: SSRDeferredUpdate<never>;
  const response = await gate.handle(request(), async () => {
    submission = gate.defer(async () => {
      throw new Error('deferred failed');
    });
    expect(() => gate.defer(async () => {})).toThrow('queue is full');
    return new Response('old');
  });
  const failed = expect(submission.completed).rejects.toThrow(
    'deferred failed',
  );
  await response.text();
  await failed;
  const retry = gate.defer(() => gate.update(async () => {}));
  expect(await retry.completed).toBe(1);
});

it('keeps a deferred update pending after disconnect until producer cancellation settles', async () => {
  const gate = coordinator();
  const abort = new AbortController();
  const producer = deferred();
  let submission!: SSRDeferredUpdate<number>;
  await gate.handle(
    new Request('http://localhost/', { signal: abort.signal }),
    async work => {
      work.track(producer.promise);
      submission = gate.defer(() => gate.update(async () => {}));
      return new Response(new ReadableStream());
    },
  );
  abort.abort();
  await tick();
  expect(gate.status.activeRequests).toBe(1);
  expect(gate.status.generation).toBe(0);
  producer.reject(new Error('producer cancelled'));
  expect(await submission.completed).toBe(1);
  expect(gate.status.activeRequests).toBe(0);
});

it('rejects submission from update and admission policy contexts', async () => {
  const policyErrors: string[] = [];
  const gate = coordinator({
    requestPolicy() {
      for (const operation of [
        () => gate.assertUpdateAllowed(),
        () => gate.defer(async () => {}),
      ]) {
        try {
          operation();
        } catch (error) {
          policyErrors.push((error as Error).message);
        }
      }
      return 'reject';
    },
  });
  const publication = deferred();
  const update = gate.update(async () => {
    expect(() => gate.defer(async () => {})).toThrow('nested SSR update');
    await publication.promise;
  });
  await tick();
  expect(
    (await gate.handle(request(), async () => new Response('unsafe'))).status,
  ).toBe(503);
  expect(policyErrors).toEqual([
    'Cannot update SSR from an admission policy',
    'Cannot submit SSR updates from an admission policy',
  ]);
  publication.resolve();
  await update;
});
