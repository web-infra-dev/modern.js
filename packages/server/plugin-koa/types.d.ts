/// <reference path="./dist/types/index.d.ts" />

declare module '@modern-js/runtime/server' {
  import { Context } from 'koa';

  export function useContext(): Context;
}
