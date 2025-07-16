import { useHonoContext } from '@modern-js/plugin-bff/hono';
import { add } from 'lodash-es';

export const get = () => {
  const context = useContext();

  return {
    company: 'bytedance',
    addRes: add(1, 2),
    url: context.url,
  };
};
