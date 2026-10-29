import { createServerBase, useHonoContext } from '../src';
import {
  createDefaultServer,
  getDefaultAppContext,
  getDefaultConfig,
} from './helpers';

describe('server base', () => {
  it('should support registering options handler', async () => {
    const server = createServerBase({
      config: getDefaultConfig(),
      pwd: '',
      appContext: getDefaultAppContext(),
    });

    server.options('/api/ping', c => c.body(null, 204));

    const response = await server.request('/api/ping', {
      method: 'OPTIONS',
    });

    expect(response.status).toBe(204);
    expect(response.body).toBe(null);
  });

  it.each([false, true])(
    'should return a Response for unfinalized middleware (read res: %s)',
    async readResponse => {
      const server = createDefaultServer();
      const onError = rs.fn((error, c) => c.text(error.message, 500));
      server.onError(onError);
      server.use('*', async (c, next) => {
        if (readResponse) {
          c.res.headers.get('content-type');
        }
        await next();
      });
      server.get('/unfinished', c => {
        c.status(404);
      });

      const response = await server.request('/unfinished');

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(500);
      expect(await response.text()).toContain('Context is not finalized');
      expect(onError).toHaveBeenCalledTimes(1);
    },
  );

  it('should preserve a returned redirect response and upstream headers', async () => {
    const server = createDefaultServer();
    server.use('*', async (c, next) => {
      c.header('X-Upstream', 'preserved');
      await next();
    });
    server.get('/redirect', c => c.redirect('/target', 301));

    const response = await server.request('/redirect');

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('/target');
    expect(response.headers.get('X-Upstream')).toBe('preserved');
  });

  it('should preserve a response assigned before returning void', async () => {
    const server = createDefaultServer();
    server.get('/assigned', c => {
      c.res = c.text('assigned', 429);
    });

    const response = await server.request('/assigned');

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(429);
    expect(await response.text()).toBe('assigned');
  });

  it('should preserve the default not-found response', async () => {
    const server = createDefaultServer();

    const response = await server.request('/missing');

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(404);
  });

  it('should keep request contexts isolated across concurrent handlers', async () => {
    const server = createDefaultServer();
    server.get('/:id', async c => {
      expect(useHonoContext()).toBe(c);
      await Promise.resolve();
      expect(useHonoContext()).toBe(c);
      return c.text(c.req.param('id'));
    });

    const responses = await Promise.all([
      server.request('/first'),
      server.request('/second'),
    ]);

    expect(
      await Promise.all(responses.map(response => response.text())),
    ).toEqual(['first', 'second']);
  });
});
