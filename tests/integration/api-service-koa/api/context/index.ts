export const get = async () => {
  const { useContext } = await import('@modern-js/runtime/koa');
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const ctx = useContext();
  const { res } = ctx;
  res.setHeader('x-id', '1');
  return {
    message: 'Hello Modern.js',
  };
};

export const post = async () => {
  const { useContext } = await import('@modern-js/runtime/koa');
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const ctx = useContext();
  return {
    message: ctx.message,
  };
};
