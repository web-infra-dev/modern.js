import type {
  AfterMatchHook,
  AfterRenderHook,
  UnstableMiddleware,
  UnstableMiddlewareContext,
} from '@modern-js/runtime/server';

const time: UnstableMiddleware = async (c: UnstableMiddlewareContext, next) => {
  const start = Date.now();

  await next();

  const end = Date.now();

  console.log(`dur=${end - start}`);
};

export const unstableMiddleware: UnstableMiddleware[] = [time];

export const afterMatch: AfterMatchHook = (ctx, next) => {
  console.log('afterMatch', 1);
  next();
};

export const afterRender: AfterRenderHook = (ctx, next) => {
  console.log('afterRender', 1);
  next();
};
