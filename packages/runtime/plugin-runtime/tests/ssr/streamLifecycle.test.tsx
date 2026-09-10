import type { AddressInfo } from 'node:net';
import { rstest } from '@rstest/core';
import type React from 'react';
import { Suspense, lazy } from 'react';
import { createNodeServer } from '../../../../server/core/src/adapters/node/node';
import { createSSRRequestCoordinator } from '../../../../server/core/src/adapters/node/requestCoordinator';
import { JSX_SHELL_STREAM_END_MARK } from '../../src/common';
import { createReadableStreamFromElement as nodeRenderer } from '../../src/core/server/stream/createReadableStream';
import { createReadableStreamFromElement as webRenderer } from '../../src/core/server/stream/createReadableStream.worker';
import { enqueueFromEntries } from '../../src/core/server/stream/deferredScript';
import type { CreateReadableStreamFromElementOptions } from '../../src/core/server/stream/shared';
import { renderSSRStream as webStreamFixture } from './fixtures/renderSSRStream';

const fixture = rstest.hoisted(() => ({
  templates: rstest.fn(async () => ({
    shellBefore: '<html>',
    shellAfter: '</html>',
  })),
  activeDeferreds: new Map<string, unknown>(),
}));
rstest.mock('../../src/core/server/stream/template', () => ({
  getTemplates: fixture.templates,
}));
rstest.mock('../../src/core/context', () => ({
  getGlobalInternalRuntimeContext: () => ({
    hooks: { extendStreamSSR: { call: () => [] } },
  }),
}));
rstest.mock('@modern-js/runtime-utils/node', () => ({
  storage: { useContext: () => ({ activeDeferreds: fixture.activeDeferreds }) },
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function options(extra: Partial<CreateReadableStreamFromElementOptions> = {}) {
  return {
    runtimeContext: {},
    config: {},
    ssrConfig: {},
    htmlTemplate: '',
    entryName: 'main',
    onError: () => {},
    ...extra,
  } as CreateReadableStreamFromElementOptions;
}
const root = (
  <>
    <div>shell</div>
    {JSX_SHELL_STREAM_END_MARK}
  </>
);
const request = (signal?: AbortSignal) =>
  new Request('http://localhost/', {
    signal,
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    },
  });

beforeEach(() => {
  fixture.templates.mockReset();
  fixture.templates.mockResolvedValue({
    shellBefore: '<html>',
    shellAfter: '</html>',
  });
  fixture.activeDeferreds.clear();
});

describe.each([
  ['Node', nodeRenderer],
  ['Web', webRenderer],
] as const)('%s renderer', (_, createReadableStreamFromElement) => {
  it('drains real React streaming after HTTP disconnect on the same server', async () => {
    const gate = createSSRRequestCoordinator({
      maxPendingRequests: 4,
      requestTimeoutMs: 2000,
      drainTimeoutMs: 2000,
    });
    const producer = deferred<string>();
    const disconnected = deferred<void>();
    fixture.activeDeferreds.set('route', {
      pendingKeys: ['value'],
      data: { value: producer.promise },
    });
    let version = 'old';
    const server = await createNodeServer(req =>
      gate.handle(req, async work => {
        if (new URL(req.url).pathname !== '/stream')
          return new Response(version);
        req.signal.addEventListener('abort', () => disconnected.resolve(), {
          once: true,
        });
        return new Response(
          await createReadableStreamFromElement(req, root, options({ work })),
        );
      }),
    );
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => {
        server.off('error', reject);
        resolve();
      });
    });
    const port = (server.address() as AddressInfo).port;
    const pid = process.pid;
    const url = `http://127.0.0.1:${port}`;
    const controller = new AbortController();
    try {
      const response = await fetch(`${url}/stream`, {
        signal: controller.signal,
      });
      const reader = response.body!.getReader();
      expect(new TextDecoder().decode((await reader.read()).value)).toContain(
        'shell',
      );
      controller.abort();
      await disconnected.promise;
      const mutate = rstest.fn(async () => {
        version = 'new';
      });
      const update = gate.update(mutate);
      await new Promise(resolve => setImmediate(resolve));
      expect(gate.status.activeRequests).toBe(1);
      expect(mutate).not.toHaveBeenCalled();
      const next = fetch(url);
      producer.resolve('finished');
      await update;
      expect(await (await next).text()).toBe('new');
      expect(process.pid).toBe(pid);
      expect((server.address() as AddressInfo).port).toBe(port);
    } finally {
      producer.resolve('finished');
      controller.abort();
      server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

  it('a cancelled request keeps unfinished template processing leased', async () => {
    const template = deferred<{ shellBefore: string; shellAfter: string }>();
    const started = deferred<void>();
    fixture.templates.mockImplementation(() => {
      started.resolve();
      return template.promise;
    });
    const gate = createSSRRequestCoordinator({
      maxPendingRequests: 1,
      requestTimeoutMs: 1000,
      drainTimeoutMs: 1000,
    });
    const controller = new AbortController();
    const req = request(controller.signal);
    const response = gate.handle(
      req,
      async work =>
        new Response(
          await createReadableStreamFromElement(req, root, options({ work })),
        ),
    );
    // Node rejects early; Web may wait for its template promise before observing cancellation.
    void response.catch(() => {});
    await started.promise;
    controller.abort(new Error('client left'));
    const mutate = rstest.fn(async () => {});
    const update = gate.update(mutate);
    await new Promise(resolve => setImmediate(resolve));
    expect(mutate).not.toHaveBeenCalled();
    template.resolve({ shellBefore: '', shellAfter: '' });
    await expect(response).rejects.toThrow('client left');
    await expect(update).resolves.toBe(1);
  });
  it('rejects template errors instead of leaving the render pending', async () => {
    fixture.templates.mockRejectedValue(new Error('template failure'));
    await expect(
      createReadableStreamFromElement(request(), root, options()),
    ).rejects.toThrow('template failure');
  });

  it('rejects fallback template errors too', async () => {
    fixture.templates.mockRejectedValue(new Error('fallback template failure'));
    const Broken = () => {
      throw new Error('shell failure');
    };
    await expect(
      createReadableStreamFromElement(request(), <Broken />, options()),
    ).rejects.toThrow('fallback template failure');
  });

  it('reports all-ready independently after the shell was delivered', async () => {
    const module = deferred<{ default: () => React.ReactNode }>();
    const Component = lazy(() => module.promise);
    const allReady = rstest.fn();
    const stream = await createReadableStreamFromElement(
      request(),
      <>
        <div>shell</div>
        <main>
          <Suspense fallback="loading">
            <Component />
          </Suspense>
        </main>
        {JSX_SHELL_STREAM_END_MARK}
      </>,
      options({ onAllReady: allReady }),
    );
    const text = new Response(stream).text();
    expect(allReady).not.toHaveBeenCalled();
    module.resolve({ default: () => 'finished' });
    expect(await text).toContain('finished');
    expect(allReady).toHaveBeenCalledTimes(1);
  });

  it('keeps the body open for deferred scripts after React finishes', async () => {
    const value = deferred<string>();
    fixture.activeDeferreds.set('route', {
      pendingKeys: ['value'],
      data: { value: value.promise },
    });
    const stream = await createReadableStreamFromElement(
      request(),
      root,
      options(),
    );
    const reader = stream.getReader();
    expect((await reader.read()).done).toBe(false);
    value.resolve('late-value');
    const chunks: string[] = [];
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      chunks.push(new TextDecoder().decode(chunk.value));
    }
    expect(chunks.join('')).toContain('late-value');
  });

  it('disconnect aborts React but holds updates until independent deferred work settles', async () => {
    const coordinator = createSSRRequestCoordinator({
      maxPendingRequests: 2,
      requestTimeoutMs: 1000,
      drainTimeoutMs: 1000,
    });
    const controller = new AbortController();
    const value = deferred<string>();
    const module = deferred<{ default: () => React.ReactNode }>();
    const Component = lazy(() => module.promise);
    fixture.activeDeferreds.set('route', {
      pendingKeys: ['value'],
      data: { value: value.promise },
    });
    const req = request(controller.signal);
    const response = await coordinator.handle(req, async work => {
      work.track(module.promise);
      return new Response(
        await createReadableStreamFromElement(
          req,
          <>
            <div>shell</div>
            <main>
              <Suspense fallback="loading">
                <Component />
              </Suspense>
            </main>
            {JSX_SHELL_STREAM_END_MARK}
          </>,
          options({ work }),
        ),
      );
    });
    expect(response.status).toBe(200);
    await response.body!.getReader().read();
    controller.abort(new Error('client left'));
    const mutate = rstest.fn(async () => {});
    const update = coordinator.update(mutate);
    await new Promise(resolve => setImmediate(resolve));
    expect(coordinator.status.activeRequests).toBe(1);
    expect(mutate).not.toHaveBeenCalled();
    module.resolve({ default: () => 'finished' });
    await new Promise(resolve => setImmediate(resolve));
    expect(mutate).not.toHaveBeenCalled();
    value.resolve('late');
    await expect(update).resolves.toBe(1);
  });
});

it('deferred cancellation suppresses writes without settling underlying work', async () => {
  const value = deferred<string>();
  const abort = new AbortController();
  const emit = rstest.fn();
  const completion = enqueueFromEntries(
    [['route', { pendingKeys: ['value'], data: { value: value.promise } }]],
    undefined,
    emit,
    abort.signal,
  );
  abort.abort();
  const settled = rstest.fn();
  void completion.then(settled);
  await Promise.resolve();
  expect(settled).not.toHaveBeenCalled();
  value.resolve('late');
  await completion;
  expect(emit).not.toHaveBeenCalled();
});

it('one deferred serialization failure still waits for other pending tasks', async () => {
  const value = deferred<string>();
  const completion = enqueueFromEntries(
    [
      [
        'route',
        {
          pendingKeys: ['broken', 'value'],
          data: { broken: Promise.resolve(1n), value: value.promise },
        },
      ],
    ],
    undefined,
    () => {},
  );
  const checked = expect(completion).rejects.toThrow();
  const settled = rstest.fn();
  void completion.then(settled, settled);
  await new Promise(resolve => setImmediate(resolve));
  expect(settled).not.toHaveBeenCalled();
  value.resolve('late');
  await checked;
});

it('Web cancellation keeps ownership until the original reader cancellation finishes', async () => {
  const cancelling = deferred<void>();
  const source = Object.assign(
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('shell'));
      },
      cancel() {
        return cancelling.promise;
      },
    }),
    { allReady: Promise.resolve() },
  );
  webStreamFixture.mockResolvedValueOnce(source);
  const gate = createSSRRequestCoordinator({
    maxPendingRequests: 1,
    requestTimeoutMs: 1000,
    drainTimeoutMs: 1000,
  });
  const controller = new AbortController();
  const req = request(controller.signal);
  await gate.handle(
    req,
    async work => new Response(await webRenderer(req, root, options({ work }))),
  );
  controller.abort(new Error('client left'));
  const mutate = rstest.fn(async () => {});
  const update = gate.update(mutate);
  await new Promise(resolve => setImmediate(resolve));
  expect(mutate).not.toHaveBeenCalled();
  cancelling.resolve();
  await expect(update).resolves.toBe(1);
});
