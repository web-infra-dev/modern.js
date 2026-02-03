import { useHonoContext } from '@modern-js/server-runtime';

export const post = async () => {
  const ctx = useHonoContext();
  return {
    message: 'Hello Modern.js',
  };
};
