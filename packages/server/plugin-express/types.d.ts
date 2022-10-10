/// <reference path="./dist/types/index.d.ts" />

declare module '@modern-js/runtime/express' {
  import { Request, Response, RequestHandler } from 'express';

  type ExpressOptions = {
    addMiddleware: (...input: RequestHandler[]) => void;
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

declare module '@modern-js/runtime/server' {
  import { Request, Response, RequestHandler } from 'express';

  type ExpressOptions = {
    addMiddleware: (...input: RequestHandler[]) => void;
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
