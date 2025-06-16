import { Suspense } from 'react';
import UserData from './UserData';

export default function UserPage({ loaderData }: { loaderData: any }) {
  const { user } = loaderData;
  console.log('render user page');
  return (
    <div>
      User page
      <Suspense fallback={<div>Loading...</div>}>
        <UserData userData={user} />
      </Suspense>
    </div>
  );
}
