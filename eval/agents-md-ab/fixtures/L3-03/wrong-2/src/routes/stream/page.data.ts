import { defer } from '@modern-js/runtime/router';

export const loader = () => {
  const slow = new Promise<string>(resolve => {
    setTimeout(() => resolve('deferred-ok'), 500);
  });
  return defer(slow as never);
};
