/// <reference path="./dist/types/index.d.ts" />

declare module '@modern-js/runtime/server' {
  import type { Next } from 'koa'
  import type { Context } from 'egg'

  export function useContext(): Context;

  type RequestHandler = () => (ctx: Context, next: Next) => Promise<void>

  type EggOptions = {
    addMiddleware: (...input: RequestHandler[]) => void;
  };

  type EggAttacher = (options: EggOptions) => void;

  export function hook(attacher: EggAttacher): EggAttacher;
  export * from '@modern-js/bff-runtime';
}
