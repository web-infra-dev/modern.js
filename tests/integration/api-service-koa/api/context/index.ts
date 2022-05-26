import { useContext } from '@modern-js/runtime/server';

export default async () => {
  const ctx = useContext();
  const { res } = ctx;
  res.setHeader('x-id', '1');
  return {
    message: 'Hello Modern.js',
  };
};
