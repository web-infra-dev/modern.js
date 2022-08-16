import type { Middleware } from 'koa';

export const hook = (attacher: Middleware) => attacher;
export { useContext } from './context';
export * from '@modern-js/bff-core';
