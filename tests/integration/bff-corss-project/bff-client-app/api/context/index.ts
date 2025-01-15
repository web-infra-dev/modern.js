import { useContext } from '@modern-js/runtime/server';

export default async () => {
  const ctx = useContext();
  const { res } = ctx;
  res.append('x-id', '1');
  return {
    message: 'Hello Modern.js',
  };
};
