import { createRequire } from 'node:module';
import path from 'node:path';
import { expect, test, rstest } from '@rstest/core';
import { modernPackage, nodeRequire } from './ssr-update/packages.mjs';

const serverCore = modernPackage('@modern-js/server-core');
const { Hono } = createRequire(path.join(serverCore, 'package.json'))('hono');
const { createSSRApplication } = nodeRequire(
  path.join(serverCore, 'dist/cjs/adapters/node'),
);
const limits = {
  maxPendingRequests: 2,
  requestTimeoutMs: 1000,
  drainTimeoutMs: 1000,
};
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => {
    resolve = done;
  });
  return { promise, resolve };
}
const unavailable = () =>
  new Response('Producer is rebuilding', {
    status: 503,
    headers: { 'Cache-Control': 'no-store', 'Retry-After': '1' },
  });

// Exercise the built Node middleware without opening a listener. Rejected
// requests must not acquire a generation lease, consume actions or enter CSR.
test('returns the admission response unchanged, observes the original signal and preserves POST bodies', async () => {
  const entered = deferred();
  let rejected = true;
  let observed: Request | undefined;
  const bodies: string[] = [];
  const render = rstest.fn(async () => new Response(`SSR:${bodies.at(-1)}`));
  const renderCSR = rstest.fn(() => new Response('CSR'));
  const resolveScope = rstest.fn(() => ['index']);
  const application = await createSSRApplication({
    ...limits,
    resolveScope,
    renderCSR,
    beforeRequest: async (request: Request) => {
      observed = request;
      if (!rejected) return;
      entered.resolve();
      if (!request.signal.aborted)
        await new Promise<void>(resolve =>
          request.signal.addEventListener('abort', () => resolve(), {
            once: true,
          }),
        );
      return unavailable();
    },
    load: async () => ({ templates: {}, serverManifest: {}, render }),
  });
  const app = new Hono();
  app.use('*', application.middleware);
  const handler = rstest.fn(async context => {
    bodies.push(await context.req.raw.text());
    return context.get('ssrRender')(context.req.raw, {});
  });
  app.post('/', handler);
  const controller = new AbortController();
  const request = new Request('http://host.test/', {
    method: 'POST',
    body: 'must-not-run',
    signal: controller.signal,
  });
  try {
    const pending = app.fetch(request);
    await entered.promise;
    expect(observed).toBe(request);
    expect(observed!.signal).toBe(request.signal);
    expect(application.status.activeRequests).toBe(0);
    expect(application.status.pendingRequests).toBe(0);
    const reason = new Error('client disconnected while waiting');
    controller.abort(reason);
    const response = await pending;
    expect(observed!.signal.reason).toBe(reason);
    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Retry-After')).toBe('1');
    expect(await response.text()).toBe('Producer is rebuilding');
    expect(request.bodyUsed).toBe(false);
    expect(resolveScope).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
    expect(render).not.toHaveBeenCalled();
    expect(renderCSR).not.toHaveBeenCalled();

    rejected = false;
    const accepted = new Request('http://host.test/', {
      method: 'POST',
      body: 'accepted-once',
    });
    const current = await app.fetch(accepted);
    expect(current.status).toBe(200);
    expect(await current.text()).toBe('SSR:accepted-once');
    expect(observed).toBe(accepted);
    expect(bodies).toEqual(['accepted-once']);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
    expect(resolveScope).toHaveBeenCalledTimes(1);
    expect(renderCSR).not.toHaveBeenCalled();
  } finally {
    controller.abort();
    await application.close();
  }
});

test('a pre-admission response does not fall back to CSR or queue while an update is in progress', async () => {
  const entered = deferred();
  const release = deferred();
  const renderCSR = rstest.fn(() => new Response('CSR'));
  const requestPolicy = rstest.fn(() => 'csr');
  const resolveScope = rstest.fn(() => ['index']);
  const render = rstest.fn(async () => new Response('SSR'));
  const application = await createSSRApplication({
    ...limits,
    beforeRequest: async () => unavailable(),
    resolveScope,
    requestPolicy,
    renderCSR,
    load: async () => ({ templates: {}, serverManifest: {}, render }),
  });
  const app = new Hono();
  app.use('*', application.middleware);
  const handler = rstest.fn(context => context.text('application'));
  app.get('/', handler);
  const update = application.update(async () => {
    entered.resolve();
    await release.promise;
  });
  try {
    await entered.promise;
    expect(application.status.phase).toBe('updating');
    const response = await app.request('/');
    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.text()).toBe('Producer is rebuilding');
    expect(resolveScope).not.toHaveBeenCalled();
    expect(requestPolicy).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
    expect(render).not.toHaveBeenCalled();
    expect(renderCSR).not.toHaveBeenCalled();
    expect(application.status.activeRequests).toBe(0);
    expect(application.status.pendingRequests).toBe(0);
  } finally {
    release.resolve();
    await update;
    await application.close();
  }
});
