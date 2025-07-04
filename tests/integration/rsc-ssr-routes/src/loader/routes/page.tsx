'use client';

import { useLoaderData } from '@modern-js/runtime/router';

export default function Page() {
  const loaderData = useLoaderData() as string;
  return <div className="root-page">{loaderData}</div>;
}
