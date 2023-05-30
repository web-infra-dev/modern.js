import { useContext } from '@modern-js/runtime/koa';

export const get = async () => {
  const ctx = useContext();
  const { res } = ctx;
  res.setHeader('x-id', '1');
  return {
    message: 'Hello Modern.js',
  };
};

export const post = async () => {
  const ctx = useContext();
  return {
    message: ctx.message,
  };
};
