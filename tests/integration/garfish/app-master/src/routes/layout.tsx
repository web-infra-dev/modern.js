import { Outlet, Link } from '@modern-js/runtime/router';

const Layout = () => (
  <div>
    <div>
      <Link to={'/table'}>加载约定式路由子应用</Link>
    </div>
    <div>
      <Link to={'/dashboard'}>加载自控式路由子应用</Link>
    </div>
    <div>
      <Link to={'/'}>卸载子应用</Link>
    </div>
    <Outlet />
  </div>
);

export default Layout;
