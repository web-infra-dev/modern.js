import { AfterRenderHook } from '@modern-js/runtime/server';

export const afterRender: AfterRenderHook = (ctx, next) => {
  const { response, request } = ctx;
  const { pathname } = request;

  response.cookies.set('x-test-language', 'zh-en');
  response.cookies.set('x-test-city', 'zhejiang');
  response.set('x-modern-age', '18');

  if (pathname === '/header') {
    const age = response.get('x-modern-age');
    response.set('x-modern-name', 'hello-modern');

    response.raw(`${age}yearold`, {
      headers: {},
      status: 200,
    });
  } else if (pathname === '/status') {
    response.status(201);
  } else if (pathname === '/cookies-clear') {
    response.cookies.clear();
  } else if (pathname === '/raw') {
    response.raw('hello world', {
      headers: {
        'x-modern-name': 'hello-modern',
      },
      status: 201,
    });

    next();
  }
};
