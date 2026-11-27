import { Outlet } from '@modern-js/runtime/router';
export default function Layout(props: Record<string, unknown>) {
  return <Outlet context={props} />;
}
