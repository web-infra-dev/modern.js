import { createStorage } from '@modern-js/bff-core';
import type { Request, Response } from 'express';

export type Context = { req: Request; res: Response };

const { run, useContext } = createStorage<Context>();

export { run, useContext };

export function useFiles() {
  const ctx = useContext();
  const files = (ctx.req as any).files;
  return files;
}
