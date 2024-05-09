import { UnstableMiddleware, parseQuery } from '@modern-js/runtime/server';
import { Var } from '../shared';

function time(): UnstableMiddleware {
  return async (c, next) => {
    const start = Date.now();

    await next();

    const end = Date.now();

    c.res.headers.set('server-timing', `render; dur=${end - start}`);
  };
}

function auth(): UnstableMiddleware<Var> {
  function getUserInfo(req: Request) {
    const query = parseQuery(req);

    if (query.unlogin) {
      return null;
    }
    return {
      name: 'Liming',
    };
  }

  // eslint-disable-next-line consistent-return
  return async (c, next) => {
    const user = await getUserInfo(c.req);

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

    const response = c.res;
    const text = await response.text();

    const newText = text.replace('<html>', `<html lang="${language}">`);

    const newheaders = response.headers;
    newheaders.set('x-custom-value', 'modern');

    c.res = c.body(newText, {
      status: response.status,
      headers: newheaders,
    });
  };
}

export const unstableMiddleware: UnstableMiddleware[] = [
  time(),
  auth() as unknown as UnstableMiddleware,
  injectMessage(),
];
