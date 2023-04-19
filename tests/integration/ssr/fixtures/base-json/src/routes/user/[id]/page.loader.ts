import { json, LoaderFunctionArgs } from '@modern-js/runtime/router';
import type { User } from './page';

export default async ({ params }: LoaderFunctionArgs) => {
  const userId = params.id;

  const user = new Promise<User>(resolve => {
    setTimeout(() => {
      resolve({
        name: `user${userId}`,
        age: 18,
      });
    }, 200);
  });

  return json(await user);
};
