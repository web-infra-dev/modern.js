import { Await, useLoaderData } from '@modern-js/runtime/router';
import { Suspense } from 'react';

export interface User {
  name: string;
  age: number;
}

interface Data {
  data: User;
}

const Page = () => {
  const data = useLoaderData() as Data;

  return (
    <div>
      user info:
      <Suspense fallback={<div id="loading">loading user data ...</div>}>
        <Await resolve={data.data}>
          {(user: User) => {
            return (
              <div id="data">
                {user.name}-{user.age}
              </div>
            );
          }}
        </Await>
      </Suspense>
    </div>
  );
};

export default Page;
