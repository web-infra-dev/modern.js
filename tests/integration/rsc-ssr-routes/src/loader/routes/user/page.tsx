import { Suspense } from 'react';
import UserData from './UserData';
import './page.css';
import { preinit } from 'react-dom';

// preinit(
//   'http://localhost:8080/static/css/async/src_loader_routes_user_page_css.css',
//   { as: 'style' },
// );

export default function UserPage({
  loaderData,
  matches,
}: { loaderData: any; matches: any[] }) {
  const { user } = loaderData;
  return (
    <div className="user-page">
      User page
      {/* <link
        rel="stylesheet"
        href="http://localhost:8080/static/css/async/src_loader_routes_user_page_css.css"
      /> */}
      <Suspense fallback={<div>Loading...</div>}>
        <div className="user-page-data-container">
          <UserData userData={user} />
        </div>
      </Suspense>
    </div>
  );
}
