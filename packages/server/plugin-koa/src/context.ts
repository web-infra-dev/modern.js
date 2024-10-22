import { createStorage } from '@modern-js/bff-core';

import type { Context } from 'koa';

export type { Context };

const { run, useContext } = createStorage<Context>();

export { run, useContext };

export function useFiles() {
  const ctx = useContext();
  const files = ctx.request.files;
  return files;
}
