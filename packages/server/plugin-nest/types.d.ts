import type { NestContext } from './dist/context';
declare module '@modern-js/runtime/server' {
  export function useContext(): NestContext;
}
