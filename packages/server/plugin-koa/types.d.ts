/// <reference path="./dist/types/index.d.ts" />
declare module '@modern-js/runtime/server' {

  import { Context, Middleware } from 'koa';

  type KoaOptions = {
    addMiddleware: (...input: Middleware[]) => void;
  };

  type KoaAttacher = (options: KoaOptions) => void;

  export function useContext(): Context;

  export function hook(attacher: KoaAttacher): KoaAttacher;

  export * from '@modern-js/bff-core';

  export * from '@modern-js/bff-runtime';
}
