'use client';

import { useLoaderData } from '@modern-js/runtime/router';
import { Link } from '@modern-js/runtime/router';

export default function ClientOnlyWithLoaderPage() {
  const loaderData = useLoaderData() as { message: string };
  return (
    <div className="client-only-with-loader-page">
      <h1>Client Only With Loader Page</h1>
      <p className="client-only-with-loader-data">{loaderData.message}</p>
      <Link className="home-link" to="/">
        Back to home
      </Link>
    </div>
  );
}
