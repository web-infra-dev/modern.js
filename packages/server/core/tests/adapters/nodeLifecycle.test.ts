import { once } from 'node:events';
import { Agent, request } from 'node:http';
import { type ClientHttp2Session, connect, createServer } from 'node:http2';
import type { AddressInfo } from 'node:net';
import { createNodeServer } from '../../src/adapters/node/node';

describe.each(['http', 'http2'])('%s request cancellation', protocol => {
  it.each([
    { method: 'GET', disconnect: false },
    { method: 'POST', disconnect: false },
    { method: 'GET', disconnect: true },
  ])('$method with disconnect=$disconnect', async ({ method, disconnect }) => {
    let signal: AbortSignal | undefined;
    let body: string | undefined;
    const adapter = await createNodeServer(async req => {
      signal = req.signal;
      if (method === 'POST') body = await req.text();
      return new Response(
        disconnect
          ? new ReadableStream({
              start(controller) {
                controller.enqueue(new TextEncoder().encode('first chunk'));
              },
            })
          : 'complete',
      );
    });
    const server =
      protocol === 'http'
        ? adapter
        : createServer(adapter.getRequestListener());
    let responseClosed!: () => void;
    const closed = new Promise<void>(resolve => {
      responseClosed = resolve;
    });
    server.once('request', (_req, res) => res.once('close', responseClosed));
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    let session: ClientHttp2Session | undefined;

    try {
      const result = await new Promise<string>((resolve, reject) => {
        let result = '';
        if (protocol === 'http') {
          const req = request(url, { method, agent: new Agent() }, res => {
            res.setEncoding('utf8');
            res.on('data', chunk => {
              result += chunk;
              if (disconnect) {
                req.destroy();
                resolve(result);
              }
            });
            res.on('error', reject);
            res.on('end', () => resolve(result));
          });
          req.on('error', reject);
          req.end(method === 'POST' ? 'request body' : undefined);
        } else {
          session = connect(url);
          session.on('error', reject);
          const req = session.request({ ':method': method, host: 'localhost' });
          req.setEncoding('utf8');
          req.on('data', chunk => {
            result += chunk;
            if (disconnect) {
              req.close();
              resolve(result);
            }
          });
          req.on('error', reject);
          req.on('end', () => resolve(result));
          req.end(method === 'POST' ? 'request body' : undefined);
        }
      });
      await closed;
      expect(result).toBe(disconnect ? 'first chunk' : 'complete');
      expect(signal?.aborted).toBe(disconnect);
      if (method === 'POST') expect(body).toBe('request body');
    } finally {
      session?.destroy();
      if ('closeAllConnections' in server) server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close(error => (error ? reject(error) : resolve())),
      );
    }
  });
});
