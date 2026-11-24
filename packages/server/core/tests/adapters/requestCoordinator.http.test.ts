import type { AddressInfo } from 'node:net';
import { createNodeServer } from '../../src/adapters/node/node';
import { createSSRRequestCoordinator } from '../../src/adapters/node/requestCoordinator';

it('keeps a disconnected producer leased and publishes on the same HTTP server', async () => {
  const gate = createSSRRequestCoordinator({
    maxPendingRequests: 4,
    requestTimeoutMs: 2000,
    drainTimeoutMs: 2000,
  });
  let finishProducer!: () => void;
  const producer = new Promise<void>(resolve => {
    finishProducer = resolve;
  });
  let cancelled!: () => void;
  const cancellation = new Promise<void>(resolve => {
    cancelled = resolve;
  });
  let version = 'old';
  const server = await createNodeServer(req =>
    gate.handle(req, async work => {
      if (new URL(req.url).pathname === '/stream') {
        work.track(producer);
        return new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('shell'));
            },
            cancel() {
              cancelled();
            },
          }),
        );
      }
      return new Response(version);
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
  const abort = new AbortController();
  try {
    const stream = await fetch(`${url}/stream`, { signal: abort.signal });
    const reader = stream.body!.getReader();
    expect(new TextDecoder().decode((await reader.read()).value)).toBe('shell');
    abort.abort();
    await cancellation;
    expect(gate.status.activeRequests).toBe(1);
    let mutated = false;
    const update = gate.update(async () => {
      mutated = true;
      version = 'new';
    });
    await new Promise<void>(resolve => setImmediate(resolve));
    const next = fetch(url);
    expect(mutated).toBe(false);
    finishProducer();
    await update;
    expect(await (await next).text()).toBe('new');
    expect((server.address() as AddressInfo).port).toBe(port);
    expect(process.pid).toBe(pid);
  } finally {
    finishProducer();
    abort.abort();
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
