import { useContext } from '@modern-js/runtime/koa';

export const get = () => {
  const context = useContext();
  console.log(context.url);

  return {
    company: 'bytedance',
  };
};
