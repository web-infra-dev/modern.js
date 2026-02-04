'use client';
import { Outlet } from '@modern-js/runtime/router';
import { Suspense } from 'react';
import UserData from './UserData';
import './layout.css';

export default function UserLayout({ loaderData }: { loaderData: any }) {
  const { user, Profile } = loaderData;
  return (
    <div className="user-layout">
      user layout
      {Profile}
      <Suspense fallback={<div>Loading...</div>}>
        <UserData userData={user} />
      </Suspense>
      <Outlet />
    </div>
  );
}
