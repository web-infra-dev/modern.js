import { useHonoContext } from '@modern-js/server-runtime';
import { add } from 'lodash-es';

export const get = () => {
  const context = useHonoContext();
  const parsedUrl = new URL(context.req.url);
  const pathname = parsedUrl.pathname;

  return {
    company: 'bytedance',
    addRes: add(1, 2),
    url: pathname,
  };
};
