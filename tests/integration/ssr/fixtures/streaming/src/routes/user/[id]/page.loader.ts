import { defer, LoaderFunctionArgs } from '@modern-js/runtime/router';
import type { User } from './page';

export default ({ params }: LoaderFunctionArgs) => {
  const userId = params.id;

  const user = new Promise<User>(resolve => {
    setTimeout(() => {
      resolve({
        name: `user${userId}`,
        age: 18,
      });
    }, 200);
  });

  return defer({ data: user });
};
