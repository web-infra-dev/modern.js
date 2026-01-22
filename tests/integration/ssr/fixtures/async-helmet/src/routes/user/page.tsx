import { Helmet } from '@modern-js/runtime/head';
import { Await, useLoaderData } from '@modern-js/runtime/router';
import { Suspense } from 'react';
import type { UserInfo } from './page.data';

export default function User() {
  const { userInfo } = useLoaderData() as {
    userInfo: Promise<UserInfo>;
  };
  return (
    <div>
      <Suspense fallback={<div>Loading user info...</div>}>
        <Await resolve={userInfo}>
          {(data: UserInfo) => (
            <>
              <Helmet>
                <title>{data.title}</title>
                <meta name="description" content={data.description} />
                <link rel="canonical" href="http://localhost/user" />
              </Helmet>
              <h1>User Page</h1>
              <div id="user-info">User info loaded</div>
            </>
          )}
        </Await>
      </Suspense>
    </div>
  );
}
