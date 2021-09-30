/// <reference path="./dist/types/index.d.ts" />

declare module '@modern-js/runtime/server' {
  import { Request, Response } from 'express';

  type Context = { req: Request; res: Response };
  export function useContext(): Context;
}
