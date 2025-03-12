declare module '@modern-js/runtime/server' {
  import type { Request, Response, RequestHandler } from 'express';
  import type { Context, MiddlewareHandler, Next } from 'hono';

  import type {
    AfterMatchContext,
    AfterRenderContext,
    NextFunction,
  } from '@modern-js/types';

  export type AfterRenderHook = (
    context: AfterRenderContext,
    next: NextFunction,
  ) => void;

  export type AfterMatchHook = (
    context: AfterMatchContext,
    next: NextFunction,
  ) => void;

  export type Middleware = (
    context: MiddlewareContext,
    next: NextFunction,
  ) => Promise<void> | void;

  type HonoOptions = {
    addMiddleware: (...input: MiddlewareHandler[]) => void;
    afterRender: (hook: AfterRenderHook) => void;
    afterMatch: (hook: AfterMatchHook) => void;
  };

  type HonoAttacher = (options: HonoOptions) => void;

  export function useContext(): Context;

  export function hook(attacher: HonoAttacher): HonoAttacher;

  export const Pipe: import('../src/runtime').Pipe;
  export const Middleware: import('../src/runtime').Middleware;

  export type { RequestHandler };

  export * from '@modern-js/bff-core';
  export * from '@modern-js/bff-runtime';
}
