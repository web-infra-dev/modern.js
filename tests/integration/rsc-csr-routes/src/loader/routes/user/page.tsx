import { Suspense } from 'react';
import UserData from './UserData';
import './page.css';

export default function UserPage({ loaderData }: { loaderData: any }) {
  const { user } = loaderData;
  return (
    <div className="user-page">
      User page
      <Suspense fallback={<div>Loading...</div>}>
        <div className="user-page-data-container">
          <UserData userData={user} />
        </div>
      </Suspense>
    </div>
  );
}
