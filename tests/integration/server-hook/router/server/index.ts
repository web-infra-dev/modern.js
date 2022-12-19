import { AfterMatchHook } from '@modern-js/runtime/server';

export const afterMatch: AfterMatchHook = (ctx, next) => {
  const { request, router } = ctx;
  const { pathname } = request;

  if (pathname === '/rewrite') {
    router.rewrite('entry');
  } else if (pathname === '/redirect') {
    router.redirect('https://modernjs.dev/', 302);
  }

  next();
};
