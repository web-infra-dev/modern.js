import { type LoaderFunctionArgs, defer } from '@modern-js/runtime/router';
import type { User } from './page';

export const loader = ({ params }: LoaderFunctionArgs) => {
  const userId = params.id;

  const user = new Promise<User>(resolve => {
    setTimeout(() => {
      resolve({
        name: `user${userId}`,
        age: 18,
      });
    }, 2000);
  });

  return { data: user };
};
