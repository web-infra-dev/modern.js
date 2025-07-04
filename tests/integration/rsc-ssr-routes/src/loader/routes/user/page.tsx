import { Suspense } from 'react';
import UserData from './UserData';

export default function UserPage({
  loaderData,
  matches,
}: { loaderData: any; matches: any[] }) {
  const { user } = loaderData;
  return (
    <div>
      User page
      <Suspense fallback={<div>Loading...</div>}>
        <div className="user-page-data-container">
          <UserData userData={user} />
        </div>
      </Suspense>
    </div>
  );
}
