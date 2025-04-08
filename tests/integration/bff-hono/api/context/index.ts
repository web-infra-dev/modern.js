import { useHonoContext } from '@modern-js/runtime/hono';

export default async () => {
  const ctx = useHonoContext();
  const { res } = ctx;
  res.headers.set('x-id', '1');
  return {
    message: 'Hello Modern.js',
  };
};
