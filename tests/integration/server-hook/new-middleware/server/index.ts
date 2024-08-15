import { UnstableMiddleware } from '@modern-js/runtime/server';
import { Var } from '../shared';

function time(): UnstableMiddleware {
  return async (c, next) => {
    const start = Date.now();

    await next();

    const end = Date.now();

    c.response.headers.set('server-timing', `render; dur=${end - start}`);
  };
}

function parseQuery(request: Request): URLSearchParams {
  const url = new URL(request.url);

  return url.searchParams;
}

function auth(): UnstableMiddleware<Var> {
  function getUserInfo(req: Request) {
    const query = parseQuery(req);

    if (query.get('unlogin')) {
      return null;
    }
    return {
      name: 'Liming',
    };
  }

  return async (c, next) => {
    if (c.request.url.includes('/login')) {
      return next();
    }

    const user = await getUserInfo(c.request);

    if (!user) {
      return c.redirect('/login');
    }

    c.set('user', user);

    await next();
  };
}

function getLangauge() {
  return 'en';
}

function injectMessage(): UnstableMiddleware {
  return async (c, next) => {
    await next();

    const language = await getLangauge();

    const { response } = c;
    const text = await response.text();

    const newText = text.replace('<html>', `<html lang="${language}">`);

    const newheaders = response.headers;
    newheaders.set('x-custom-value', 'modern');

    c.response = c.body(newText, {
      status: response.status,
      headers: newheaders,
    });
  };
}

function injectRequestBody(): UnstableMiddleware {
  return async (c, next) => {
    await next();

    const { request, response } = c;

    if (request.method.toUpperCase() === 'POST' && request.body) {
      const requestBody = await request.text();

      c.response = c.body(requestBody, {
        status: response.status,
        headers: response.headers,
      });
    }
  };
}

function modifyRequest(): UnstableMiddleware {
  return async (c, next) => {
    const { request } = c;

    if (request.url.includes('modify=1')) {
      c.request = new Request(
        request.url.replace('http', 'https').replace('modify=1', 'modify=222'),
      );
    }

    await next();
  };
}

export const unstableMiddleware: UnstableMiddleware[] = [
  time(),
  modifyRequest(),
  injectRequestBody(),
  injectMessage(),
  auth() as unknown as UnstableMiddleware,
];
