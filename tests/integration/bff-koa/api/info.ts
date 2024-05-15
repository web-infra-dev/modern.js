import { useContext } from '@modern-js/plugin-koa/runtime';

export const get = () => {
  const context = useContext();
  console.log(context.url);

  return {
    company: 'bytedance',
  };
};
