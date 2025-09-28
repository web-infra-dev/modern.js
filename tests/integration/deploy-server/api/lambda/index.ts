import { useHonoContext } from '@modern-js/plugin-bff/server';

export const post = async () => {
  const ctx = useHonoContext();
  return {
    message: 'Hello Modern.js',
  };
};
