import { Outlet, useLoaderData } from '@modern-js/runtime/router';
import type { loader } from './layout.data';

export default function Layout() {
  const data = useLoaderData<typeof loader>();
  return (
    <section id="hydration-layout">
      {data.title}
      <Outlet />
    </section>
  );
}
