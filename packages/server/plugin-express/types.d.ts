/// <reference path="./dist/types/index.d.ts" />

declare module '@modern-js/runtime/server' {
  import { Request, Response, RequestHandler } from 'express';

  type ExpressOptions = {
    addMiddleware: (...input: RequestHandler[]) => void;
  };

  type ExpressAttacher = (options: ExpressOptions) => void;

  type Context = { req: Request; res: Response };

  export function useContext(): Context;

  export function hook(attacher: ExpressAttacher): ExpressAttacher;

  export * from '@modern-js/bff-core';

  export * from '@modern-js/bff-runtime';
}
