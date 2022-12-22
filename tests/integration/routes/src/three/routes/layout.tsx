import { Link, Outlet } from '@modern-js/runtime/router';

export const loader = async () => {
  return {
    message: 'from  server',
  };
};

export default function Layout() {
  return (
    <div>
      root layout
      <Link to="user" className="user-btn">
        /user
      </Link>
      <Link to="user/profile"> /user/profile </Link>
      <Link to="error/loader" className="loader-error-btn">
        /error/loader
      </Link>
      <Link to="redirect" className="redirect-btn">
        /redirect
      </Link>
      <Outlet />
    </div>
  );
}
