import { useHonoContext } from '@modern-js/plugin-bff/hono';
import { defer } from '@modern-js/runtime/router';

export const loader = () => {
  const ctx = useHonoContext();

  const url = ctx.req.url;
  const parsedUrl = new URL(url);
  const name = parsedUrl.searchParams.get('name');

  const user = new Promise(resolve => {
    setTimeout(() => {
      resolve({
        name,
        age: 18,
      });
    }, 200);
  });

  return defer({ data: user });
};
