/// <reference path="./dist/types/index.d.ts" />

declare module '@modern-js/runtime/express' {
  import { Request, Response, RequestHandler } from 'express';

  type Context = { req: Request; res: Response };

  export const Pipe: import('./src/runtime').Pipe;
  export const Middleware: import('./src/runtime').Middleware;

  export function useContext(): Context;

  export type { RequestHandler };

  export * from '@modern-js/bff-core';
}


// Todo: remove on next version
// For use with BFF, it will be removed on next version, and use @modern-js/runtime/express instead?
declare module '@modern-js/runtime/server' {
  import { Request, Response, RequestHandler } from 'express';

  import type { AfterMatchContext, AfterRenderContext, NextFunction } from '@modern-js/types';

  export type AfterRenderHook = (
    context: AfterRenderContext,
    next: NextFunction,
  ) => void;

  export type AfterMatchHook = (
    context: AfterMatchContext,
    next: NextFunction,
  ) => void;

  type ExpressOptions = {
    addMiddleware: (...input: RequestHandler[]) => void;
    afterRender: (hook: AfterRenderHook) => void;
    afterMatch: (hook: AfterMatchHook) => void;
  };

  type ExpressAttacher = (options: ExpressOptions) => void;

  type Context = { req: Request; res: Response };

  export const Pipe: import('./src/runtime').Pipe;
  export const Middleware: import('./src/runtime').Middleware;

  export function useContext(): Context;

  export function hook(attacher: ExpressAttacher): ExpressAttacher;

  export type { RequestHandler };

  export * from '@modern-js/bff-core';
}
