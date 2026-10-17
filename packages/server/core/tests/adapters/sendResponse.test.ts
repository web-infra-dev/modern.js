import { once } from 'node:events';
import { Agent, type ServerResponse, request } from 'node:http';
import { connect, createServer } from 'node:http2';
import type { AddressInfo } from 'node:net';
import { Writable } from 'node:stream';
import type { NodeResponse } from '@modern-js/types/server';
import { createNodeServer, sendResponse } from '../../src/adapters/node/node';
import type { RequestHandler } from '../../src/types';

const encoder = new TextEncoder();

type ClientResult = {
  status?: number;
  headers: Record<string, unknown>;
  body: string;
  ended: boolean;
  error?: Error;
};

async function listen(
  protocol: 'http' | 'http2',
  handler: RequestHandler,
  onResponse?: (res: NodeResponse) => void,
) {
  const adapter = await createNodeServer(handler);
  const server =
    protocol === 'http' ? adapter : createServer(adapter.getRequestListener());
  server.on('request', (_req, res) => onResponse?.(res));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: () => {
      if ('closeAllConnections' in server) server.closeAllConnections();
      return new Promise<void>((resolve, reject) =>
        server.close(error => (error ? reject(error) : resolve())),
      );
    },
  };
}

function fetchFrom(
  url: string,
  protocol: 'http' | 'http2',
  {
    pause = 0,
    onData,
  }: {
    // Do not read the response for `pause` ms, to make the server buffer fill up.
    pause?: number;
    // Return `false` to disconnect.
    onData?: () => boolean;
  } = {},
) {
  return new Promise<ClientResult>(resolve => {
    const result: ClientResult = { headers: {}, body: '', ended: false };
    const chunks: Buffer[] = [];
    let disconnect = () => {};
    const consume = (stream: NodeJS.ReadableStream) => {
      if (pause) {
        stream.pause();
        setTimeout(() => stream.resume(), pause);
      }
      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
        if (onData?.() === false) {
          disconnect();
        }
      });
      stream.on('end', () => {
        result.ended = true;
      });
      stream.on('error', error => {
        result.error = error;
      });
      stream.on('close', () => {
        result.body = Buffer.concat(chunks).toString();
        resolve(result);
      });
    };

    if (protocol === 'http') {
      const req = request(url, { agent: new Agent() }, res => {
        result.status = res.statusCode;
        result.headers = res.headers;
        consume(res);
      });
      disconnect = () => req.destroy();
      req.on('error', error => {
        result.error = error;
        resolve(result);
      });
      req.end();
    } else {
      const session = connect(url);
      session.on('error', error => {
        result.error = error;
      });
      const req = session.request({ ':method': 'GET', host: 'localhost' });
      req.on('response', headers => {
        result.status = headers[':status'];
        result.headers = headers;
      });
      req.on('close', () => session.close());
      disconnect = () => req.close();
      consume(req);
      req.end();
    }
  });
}

function createBody(chunks: string[]) {
  let pulled = 0;
  const stream = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        if (pulled === chunks.length) {
          controller.close();
        } else {
          controller.enqueue(encoder.encode(chunks[pulled++]));
        }
      },
    },
    { highWaterMark: 0 },
  );
  return { stream, pulled: () => pulled };
}

describe.each(['http', 'http2'] as const)('%s sendResponse', protocol => {
  let close: (() => Promise<void>) | undefined;
  let info: ReturnType<typeof rstest.spyOn>;
  let error: ReturnType<typeof rstest.spyOn>;

  beforeEach(() => {
    info = rstest.spyOn(console, 'info').mockImplementation(() => {});
    error = rstest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    await close?.();
    close = undefined;
    rstest.restoreAllMocks();
  });

  const serve = async (
    handler: RequestHandler,
    onResponse?: (res: NodeResponse) => void,
  ) => {
    const server = await listen(protocol, handler, onResponse);
    close = server.close;
    return server.url;
  };

  it.each([
    ['a small body', () => new Response('<html>small</html>'), false],
    ['an empty body', () => new Response(''), false],
    ['a null body', () => new Response(null), false],
    [
      'streamed chunks',
      () => {
        const chunks = Array.from({ length: 20 }, (_, i) => `<div>${i}</div>`);
        return new Response(
          new ReadableStream({
            async start(controller) {
              for (const chunk of chunks) {
                await new Promise(resolve => setTimeout(resolve, 1));
                controller.enqueue(encoder.encode(chunk));
              }
              controller.close();
            },
          }),
        );
      },
      false,
    ],
    [
      'a large body to a slow client',
      () =>
        new Response(
          createBody(
            Array.from({ length: 128 }, (_, i) =>
              String(i % 10).repeat(64 * 1024),
            ),
          ).stream,
        ),
      true,
    ],
  ])('writes %s', async (_, createResponse, slowClient) => {
    const expected = await createResponse().text();
    let write: ReturnType<typeof rstest.spyOn> | undefined;
    const url = await serve(
      async () => {
        const response = createResponse();
        response.headers.set('x-custom', 'custom');
        return response;
      },
      res => {
        write = rstest.spyOn(res as ServerResponse, 'write');
      },
    );

    const result = await fetchFrom(url, protocol, {
      pause: slowClient ? 200 : 0,
    });

    expect(result.error).toBeUndefined();
    expect(result.ended).toBe(true);
    expect(result.status).toBe(200);
    expect(result.headers['x-custom']).toBe('custom');
    expect(result.body).toBe(expected);
    if (slowClient) {
      // The client did not read for a while, so writes had to wait for 'drain'.
      expect(write!.mock.results.some(({ value }) => value === false)).toBe(
        true,
      );
    }
    expect(error).not.toHaveBeenCalled();
  });

  it('keeps status and multiple set-cookie headers', async () => {
    const url = await serve(async () => {
      const headers = new Headers({ 'content-type': 'text/plain' });
      headers.append('set-cookie', 'a=1; Path=/');
      headers.append('set-cookie', 'b=2; Path=/');
      return new Response('created', { status: 201, headers });
    });

    const result = await fetchFrom(url, protocol);

    expect(result.status).toBe(201);
    expect(result.headers['content-type']).toBe('text/plain');
    expect(result.headers['set-cookie']).toEqual([
      'a=1; Path=/',
      'b=2; Path=/',
    ]);
    expect(result.body).toBe('created');
  });

  it('cancels the body when the client disconnects', async () => {
    const cancel = rstest.fn();
    const url = await serve(
      async () =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode('first chunk'));
            },
            cancel,
          }),
        ),
    );

    const result = await fetchFrom(url, protocol, { onData: () => false });

    expect(result.body).toBe('first chunk');
    await expect.poll(() => cancel.mock.calls.length).toBe(1);
    expect(cancel.mock.calls[0][0]).toMatchObject({
      name: 'AbortError',
      code: 'ABORT_ERR',
    });
    await expect.poll(() => info.mock.calls.length).toBe(1);
    expect(info).toHaveBeenCalledWith('The user aborted a request.');
    expect(error).not.toHaveBeenCalled();
  });

  it('destroys the response when the body errors', async () => {
    const failure = new Error('render failed');
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const url = await serve(
      async () =>
        new Response(
          new ReadableStream({
            start(source) {
              controller = source;
              source.enqueue(encoder.encode('first chunk'));
            },
          }),
        ),
    );

    const result = await fetchFrom(url, protocol, {
      onData: () => {
        controller.error(failure);
        return true;
      },
    });

    expect(result.body).toBe('first chunk');
    expect(result.ended).toBe(false);
    await expect.poll(() => error.mock.calls.length).toBe(1);
    expect(error).toHaveBeenCalledWith(failure);
    expect(info).not.toHaveBeenCalled();
  });
});

it('flushes event-stream headers before the first chunk', async () => {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const { url, close } = await listen(
    'http',
    async () =>
      new Response(
        new ReadableStream({
          start(source) {
            controller = source;
          },
        }),
        { headers: { 'content-type': 'text/event-stream' } },
      ),
  );

  try {
    const result = await new Promise<ClientResult>((resolve, reject) => {
      const req = request(url, { agent: new Agent() }, res => {
        // The headers arrive before the body produces anything.
        const result = { headers: res.headers, body: '', ended: false };
        res.setEncoding('utf8');
        res.on('data', chunk => {
          result.body += chunk;
        });
        res.on('end', () => resolve({ ...result, ended: true }));
        controller.enqueue(encoder.encode('data: 1\n\n'));
        controller.close();
      });
      req.on('error', reject);
      req.end();
    });
    expect(result.headers['content-type']).toBe('text/event-stream');
    expect(result.body).toBe('data: 1\n\n');
  } finally {
    await close();
  }
});

describe('sendResponse to a writable', () => {
  class MockResponse extends Writable {
    statusCode = 200;

    statusMessage = '';

    headers: Record<string, unknown> = {};

    data = '';

    callbacks: (() => void)[] = [];

    constructor() {
      super({ highWaterMark: 1024 });
    }

    setHeader(key: string, value: unknown) {
      this.headers[key] = value;
    }

    _write(chunk: Buffer, _: BufferEncoding, callback: () => void) {
      this.data += chunk.toString();
      // Keep the data buffered until `flush()` is called, like a slow socket.
      this.callbacks.push(callback);
    }

    flush() {
      this.callbacks.splice(0).forEach(callback => callback());
    }
  }

  const send = (body: BodyInit | null, res: MockResponse) =>
    sendResponse(new Response(body), res as unknown as NodeResponse);

  it('waits for drain before reading more of the body', async () => {
    const chunks = Array.from({ length: 20 }, (_, i) =>
      String(i % 10).repeat(4096),
    );
    const { stream, pulled } = createBody(chunks);
    const res = new MockResponse();
    let done = false;
    const sent = send(stream, res).then(() => {
      done = true;
    });

    for (let i = 1; i <= chunks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 5));
      // The chunk exceeds the high water mark, so nothing else is read until
      // the buffered data is flushed and the response emits 'drain'.
      expect(pulled()).toBe(i);
      expect(res.data).toBe(chunks.slice(0, i).join(''));
      expect(done).toBe(false);
      res.flush();
    }

    await sent;
    expect(res.writableEnded).toBe(true);
    expect(res.data).toBe(chunks.join(''));
  });

  it('removes its listeners once the body is written', async () => {
    const res = new MockResponse();
    const sent = send(createBody(['a'.repeat(4096), 'b']).stream, res);
    await expect.poll(() => res.listenerCount('drain')).toBe(1);
    res.flush();
    await expect.poll(() => res.callbacks.length).toBe(1);
    res.flush();
    await sent;

    expect(res.data).toBe(`${'a'.repeat(4096)}b`);
    expect(res.listenerCount('close')).toBe(0);
    expect(res.listenerCount('error')).toBe(0);
    expect(res.listenerCount('drain')).toBe(0);
  });

  it.each([
    ['closes', undefined, { code: 'ABORT_ERR' }],
    ['errors', new Error('socket error'), { message: 'socket error' }],
  ])(
    'cancels the body when the response %s while waiting for drain',
    async (_, destroyError, expected) => {
      const cancel = rstest.fn();
      const res = new MockResponse();
      const sent = send(
        new ReadableStream({
          pull(controller) {
            controller.enqueue(encoder.encode('a'.repeat(4096)));
          },
          cancel,
        }),
        res,
      );
      await expect.poll(() => res.listenerCount('drain')).toBe(1);
      res.destroy(destroyError);

      const reason = await sent.catch(error => error);
      expect(reason).toMatchObject(expected);
      expect(cancel).toHaveBeenCalledTimes(1);
      expect(cancel).toHaveBeenCalledWith(reason);
      expect(res.listenerCount('close')).toBe(0);
      expect(res.listenerCount('drain')).toBe(0);
    },
  );

  it('cancels the body when the response is already destroyed', async () => {
    const cancel = rstest.fn();
    const res = new MockResponse();
    res.destroy();
    await once(res, 'close');

    await expect(
      send(new ReadableStream({ cancel }), res),
    ).rejects.toMatchObject({ code: 'ABORT_ERR' });
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('cancels the body when writing throws', async () => {
    const cancel = rstest.fn();
    const res = new MockResponse();
    const failure = new Error('write failed');
    res.write = () => {
      throw failure;
    };

    await expect(
      send(
        new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('chunk'));
          },
          cancel,
        }),
        res,
      ),
    ).rejects.toBe(failure);
    expect(cancel).toHaveBeenCalledWith(failure);
  });

  it('destroys the response when the body errors', async () => {
    const res = new MockResponse();
    // Unlike this writable, a ServerResponse does not emit 'error' when it is
    // destroyed with an error.
    res.on('error', () => {});
    const failure = new Error('render failed');

    await expect(
      send(
        new ReadableStream({
          start(controller) {
            controller.error(failure);
          },
        }),
        res,
      ),
    ).rejects.toBe(failure);
    expect(res.destroyed).toBe(true);
    expect(res.errored).toBe(failure);
  });
});

describe('sendResponse to a closed http2 response', () => {
  it('cancels the body instead of waiting for drain', async () => {
    const cancel = rstest.fn();
    let sent: Promise<unknown> | undefined;
    const server = createServer(async (_req, res) => {
      res.destroy();
      await once(res, 'close');
      sent = sendResponse(
        new Response(
          new ReadableStream({
            pull(controller) {
              controller.enqueue(encoder.encode('x'.repeat(64 * 1024)));
            },
            cancel,
          }),
        ),
        res as unknown as NodeResponse,
      ).catch(error => error);
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');

    const session = connect(
      `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    );
    session.on('error', () => {});
    const req = session.request({ ':method': 'GET' });
    req.on('error', () => {});
    req.resume();
    req.end();
    await once(req, 'close');

    try {
      await expect.poll(() => sent).toBeDefined();
      expect(await sent).toMatchObject({ code: 'ABORT_ERR' });
      expect(cancel).toHaveBeenCalledTimes(1);
    } finally {
      session.destroy();
      await new Promise(resolve => server.close(resolve));
    }
  });
});
