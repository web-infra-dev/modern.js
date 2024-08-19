import { defer } from '@modern-js/runtime/router';
import { useContext } from '@modern-js/runtime/koa';

export const loader = () => {
  const ctx = useContext();

  const user = new Promise(resolve => {
    setTimeout(() => {
      resolve({
        name: ctx.query.name,
        age: 18,
      });
    }, 200);
  });

  return defer({ data: user });
};
