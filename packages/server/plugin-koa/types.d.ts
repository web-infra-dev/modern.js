/// <reference path="./dist/types/index.d.ts" />
declare module '@modern-js/runtime/koa' {

  import { Context, Middleware } from 'koa';

  export type { Middleware as RequestHandler };

  export function useContext(): Context;

  export * from '@modern-js/bff-core';

  export type { Context };
}

// Todo: remove on next version
declare module '@modern-js/runtime/server' {

  import { Context, Middleware } from 'koa';
  import type { AfterMatchContext, AfterRenderContext, NextFunction } from '@modern-js/types';

  export type AfterRenderHook = (
    context: AfterRenderContext,
    next: NextFunction,
  ) => void;

  export type AfterMatchHook = (
    context: AfterMatchContext,
    next: NextFunction,
  ) => void;


  type KoaOptions = {
    addMiddleware: (...input: Middleware[]) => void;
    afterRender: (hook: AfterRenderHook) => void;
    afterMatch: (hook: AfterMatchHook) => void;
  };

  type KoaAttacher = (options: KoaOptions) => void;

  export type { Middleware as RequestHandler };

  export function useContext(): Context;

  export function hook(attacher: KoaAttacher): KoaAttacher;

  export * from '@modern-js/bff-core';
}
