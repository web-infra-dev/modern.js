import UserData from '@/loader/routes/user/UserData';
import { redirect } from '@modern-js/runtime';
import { Outlet } from '@modern-js/runtime/router';
import { Suspense } from 'react';

const fetchUserData = async (): Promise<string> => {
  return new Promise(resolve =>
    setTimeout(() => resolve('user data from server'), 100),
  );
};

export default function UserPage() {
  const userDataPromise = fetchUserData();
  return (
    <div className="user-layout">
      user page
      <Suspense fallback={<div>Loading...</div>}>
        <UserData userData={userDataPromise} />
      </Suspense>
      <Outlet />
    </div>
  );
}
