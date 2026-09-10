import { createSSRRequestCoordinator } from '../../src/adapters/node/requestCoordinator';

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
const request = () => new Request('http://localhost/');
const coordinator = (overrides = {}) =>
  createSSRRequestCoordinator({
    maxPendingRequests: 2,
    requestTimeoutMs: 1000,
    drainTimeoutMs: 1000,
    ...overrides,
  });

it('drains the old response and selects the published handler after waking', async () => {
  const gate = coordinator();
  const stream = new TransformStream<Uint8Array>();
  const writer = stream.writable.getWriter();
  const old = await gate.handle(
    request(),
    async () => new Response(stream.readable),
  );
  const text = old.text();
  await writer.write(new TextEncoder().encode('old'));
  let current = 'old';
  let published = false;
  const update = gate.update(async () => {
    published = true;
    current = 'new';
  });
  await tick();
  const next = gate.handle(request(), async () => new Response(current));
  expect(published).toBe(false);
  expect(gate.status.pendingRequests).toBe(1);
  await writer.close();
  expect(await text).toBe('old');
  expect(await update).toBe(1);
  expect(await (await next).text()).toBe('new');
  expect(gate.status.activeRequests).toBe(0);
});

it('keeps producer work leased after the body ends or is cancelled', async () => {
  for (const cancel of [false, true]) {
    const gate = coordinator();
    const producer = deferred();
    const response = await gate.handle(request(), async work => {
      work.track(producer.promise);
      return new Response('shell');
    });
    if (cancel) await response.body!.cancel();
    else expect(await response.text()).toBe('shell');
    const update = gate.update(async () => {});
    await tick();
    expect(gate.status.phase).toBe('draining');
    expect(gate.status.activeRequests).toBe(1);
    producer.resolve();
    await update;
    expect(gate.status.activeRequests).toBe(0);
  }
});

it('disconnect does not release unsettled producer work', async () => {
  const gate = coordinator();
  const abort = new AbortController();
  const producer = deferred();
  let cancelled = false;
  await gate.handle(
    new Request('http://localhost/', { signal: abort.signal }),
    async work => {
      work.track(producer.promise);
      return new Response(
        new ReadableStream({
          cancel() {
            cancelled = true;
          },
        }),
      );
    },
  );
  abort.abort();
  await tick();
  expect(cancelled).toBe(true);
  expect(gate.status.activeRequests).toBe(1);
  producer.resolve();
  await tick();
  expect(gate.status.activeRequests).toBe(0);
});

it('times out draining before mutation and resumes the old application', async () => {
  const gate = coordinator({ drainTimeoutMs: 20 });
  const producer = deferred();
  await gate.handle(request(), async work => {
    work.track(producer.promise);
    return new Response(null, { status: 204 });
  });
  let mutated = false;
  await expect(
    gate.update(async () => {
      mutated = true;
    }),
  ).rejects.toThrow('before mutation');
  expect(mutated).toBe(false);
  expect(gate.status.generation).toBe(0);
  expect(
    await (
      await gate.handle(request(), async () => new Response('old'))
    ).text(),
  ).toBe('old');
  producer.resolve();
});

it('bounds the queue and removes only the cancelled waiter', async () => {
  const gate = coordinator({ maxPendingRequests: 1 });
  const publish = deferred();
  const update = gate.update(() => publish.promise);
  await tick();
  const abort = new AbortController();
  const waiting = gate.handle(
    new Request('http://localhost/', { signal: abort.signal }),
    async () => new Response('unused'),
  );
  const reason = new Error('disconnected');
  const rejected = expect(waiting).rejects.toBe(reason);
  // Check overflow before cancellation; the update itself must remain pending.
  const overflow = await gate.handle(
    request(),
    async () => new Response('unused'),
  );
  expect(overflow.status).toBe(503);
  abort.abort(reason);
  await rejected;
  expect(gate.status.pendingRequests).toBe(0);
  expect(gate.status.phase).toBe('updating');
  publish.resolve();
  await update;
});

it('times out an individual waiter without cancelling the update', async () => {
  const gate = coordinator({ requestTimeoutMs: 20 });
  const publish = deferred();
  const update = gate.update(() => publish.promise);
  await tick();
  const response = await gate.handle(
    request(),
    async () => new Response('unused'),
  );
  expect(response.status).toBe(503);
  expect(response.headers.get('Retry-After')).toBe('1');
  expect(gate.status.pendingRequests).toBe(0);
  expect(gate.status.phase).toBe('updating');
  publish.resolve();
  await update;
});

it('stays unavailable after mutation failure and supports an explicit retry', async () => {
  const gate = coordinator();
  const publish = deferred();
  const update = gate.update(() => publish.promise);
  const observed = expect(update).rejects.toThrow('mutation failed');
  await tick();
  const waiting = gate.handle(request(), async () => new Response('partial'));
  publish.reject(new Error('mutation failed'));
  await observed;
  expect((await waiting).status).toBe(503);
  expect(gate.status.phase).toBe('unavailable');
  expect(gate.status.generation).toBe(0);
  expect(
    (await gate.handle(request(), async () => new Response('partial'))).status,
  ).toBe(503);
  await gate.update(async () => {});
  expect(
    await (
      await gate.handle(request(), async () => new Response('recovered'))
    ).text(),
  ).toBe('recovered');
});

it('serializes updates without coalescing their outcomes or admitting stale handlers', async () => {
  const gate = coordinator();
  const first = deferred();
  const second = deferred();
  const order: number[] = [];
  const one = gate.update(async () => {
    order.push(1);
    await first.promise;
  });
  const two = gate.update(async () => {
    order.push(2);
    await second.promise;
  });
  await tick();
  const waiting = gate.handle(
    request(),
    async () => new Response(String(gate.status.generation)),
  );
  const received = waiting.then(response => response.text());
  first.resolve();
  expect(await one).toBe(1);
  await tick();
  expect(order).toEqual([1, 2]);
  // A wake from the first publication must recheck the second update's gate.
  expect(gate.status.phase).toBe('updating');
  second.resolve();
  expect(await two).toBe(2);
  expect(['1', '2']).toContain(await received);
});

it('rejects self-draining updates and ignores an unrelated coordinator context', async () => {
  const gate = coordinator();
  const other = coordinator();
  const response = await gate.handle(request(), async () => {
    await expect(gate.update(async () => {})).rejects.toThrow(
      'request being drained',
    );
    await other.update(async () => {});
    return new Response('ok');
  });
  expect(await response.text()).toBe('ok');
});

it('settles rejected tracked work without leaking a lease or swallowing render errors', async () => {
  const gate = coordinator();
  const producer = deferred();
  await expect(
    gate.handle(request(), async work => {
      work.track(producer.promise);
      throw new Error('render failed');
    }),
  ).rejects.toThrow('render failed');
  expect(gate.status.activeRequests).toBe(1);
  producer.reject(new Error('producer failed'));
  await gate.update(async () => {});
  expect(gate.status.activeRequests).toBe(0);
});

it('does not read a queued request body or select its handler before admission', async () => {
  const gate = coordinator();
  const publish = deferred();
  const update = gate.update(() => publish.promise);
  await tick();
  let reads = 0;
  let calls = 0;
  const body = new ReadableStream(
    {
      pull(controller) {
        reads++;
        controller.close();
      },
    },
    { highWaterMark: 0 },
  );
  const req = new Request('http://localhost/', {
    method: 'POST',
    body,
    duplex: 'half',
  } as RequestInit);
  const response = gate.handle(req, async () => {
    calls++;
    await req.text();
    return new Response('ok');
  });
  await tick();
  expect(reads).toBe(0);
  expect(calls).toBe(0);
  publish.resolve();
  await update;
  expect(await (await response).text()).toBe('ok');
  expect(calls).toBe(1);
});

it('rejects nested updates and gated warmup instead of waiting on itself', async () => {
  const gate = coordinator();
  await gate.update(async () => {
    await expect(gate.update(async () => {})).rejects.toThrow(
      'nest SSR updates',
    );
    await expect(
      gate.handle(request(), async () => new Response('warmup')),
    ).rejects.toThrow('active request or update');
  });
  expect(gate.status.generation).toBe(1);
});
