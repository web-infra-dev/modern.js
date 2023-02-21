import { defer } from '@modern-js/runtime/router';

export const loader = () => {
  const data = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('error occurs'));
    }, 200);
  });

  return defer({ data });
};
