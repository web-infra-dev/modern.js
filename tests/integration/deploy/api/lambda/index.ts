import { useHonoContext } from '@modern-js/server-runtime';

export const post = async () => {
  useHonoContext();
  return {
    message: 'Hello Modern.js',
  };
};
