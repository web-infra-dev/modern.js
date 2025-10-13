import { useHonoContext } from '@modern-js/plugin-bff/server';

export default async () => {
  const ctx = useHonoContext();
  const { res } = ctx;
  res.append('x-id', '1');
  return {
    message: 'Hello Modern.js',
  };
};
