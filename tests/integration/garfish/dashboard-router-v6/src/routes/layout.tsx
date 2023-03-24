import { Link, Outlet } from '@modern-js/runtime/router';

export default function Layout(props: Record<string, any>) {
  return (
    <div>
      <div>Dashboard App</div>
      <div>Props from main app: {props.msg}</div>
      <Link id={'renderRoute'} to="/detail/profile">
        Render dashboard sub route
      </Link>
      <Outlet />
    </div>
  );
}
