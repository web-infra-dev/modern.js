import { Await, useLoaderData } from '@modern-js/runtime/router';
import { Suspense } from 'react';

export interface User {
  name: string;
  age: number;
}

const Page = () => {
  const user = useLoaderData() as User;

  return (
    <div>
      user info:
      <div>
        {user.name}-${user.age}
      </div>
    </div>
  );
};

export default Page;
