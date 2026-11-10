import { Outlet } from '@modern-js/runtime/router';

export default function Layout(props: { label?: string }) {
  return <Outlet context={props} />;
}
