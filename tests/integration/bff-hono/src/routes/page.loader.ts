import { defer } from '@modern-js/runtime/router';
import { useHonoContext } from '@modern-js/server-runtime';

interface Ctx {
  path: string;
}

export interface Data {
  data: Ctx;
}

export default () => {
  const ctx = useHonoContext();
  const _ctx = new Promise<Ctx>(resolve => {
    setTimeout(() => {
      resolve({
        path: ctx.req.path,
      });
    }, 200);
  });

  return defer({ data: _ctx });
};
