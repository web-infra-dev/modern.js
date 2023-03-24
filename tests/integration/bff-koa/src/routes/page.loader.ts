import { defer } from '@modern-js/runtime/router';
import { useContext } from '@modern-js/runtime/koa';

interface User {
  name: string;
  age: number;
}

export interface Data {
  data: User;
}

export default () => {
  const ctx = useContext();

  const user = new Promise<User>(resolve => {
    setTimeout(() => {
      resolve({
        name: ctx.query.name as string,
        age: 18,
      });
    }, 200);
  });

  return defer({ data: user });
};
