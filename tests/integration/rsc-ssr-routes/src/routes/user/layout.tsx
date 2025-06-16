import { Outlet } from '@modern-js/runtime/router/browser';
import { Suspense } from 'react';
import UserData from './UserData';

export default function UserLayout({ loaderData }: { loaderData: any }) {
  const { user, Profile } = loaderData;
  return (
    <div>
      User Layout
      {Profile}
      <Suspense fallback={<div>Loading...</div>}>
        <UserData userData={user} />
      </Suspense>
      <Outlet />
    </div>
  );
}
