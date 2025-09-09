'use client';
import { useLoaderData } from '@modern-js/runtime/router';
import { Suspense, use } from 'react';

export interface User {
  name: string;
  age: number;
}

interface Data {
  data: Promise<User>;
}

const UserInfo = ({ p }: { p: Promise<User> }) => {
  const user = use(p);
  return (
    <div>
      name: {user.name}, age: {user.age}
    </div>
  );
};

const Page = () => {
  const data = useLoaderData() as Data;

  return (
    <div>
      user info:
      <Suspense fallback={<div id="loading">loading user data ...</div>}>
        <UserInfo p={data.data} />
      </Suspense>
    </div>
  );
};

export default Page;
