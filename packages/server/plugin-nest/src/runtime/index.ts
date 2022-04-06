import { useContext, NestContext } from '../context';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
declare module '@modern-js/runtime/server' {
  export function useContext(): NestContext;
}

export { useContext };
