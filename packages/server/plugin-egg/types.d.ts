/// <reference path="./dist/types/index.d.ts" />

import type { Context } from './dist/types/context';
declare module '@modern-js/runtime/server' {
  export function useContext(): Context;
}
