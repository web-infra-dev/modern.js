import { Await, useLoaderData } from '@modern-js/runtime/router';
import { Suspense } from 'react';

export interface User {
  name: string;
  age: number;
}

const Page = () => {
  const data = useLoaderData() as User;

  return (
    <div>
      user info:
      <Suspense fallback={<div>loading user data ...</div>}>
        <Await resolve={data}>
          {data => {
            const { user } = data;
            return (
              <div>
                {user.name}-${user.age}
              </div>
            );
          }}
        </Await>
      </Suspense>
    </div>
  );
};

export default Page;
