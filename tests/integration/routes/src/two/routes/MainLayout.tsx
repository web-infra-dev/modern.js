import { Outlet } from '@modern-js/runtime/router';

const MainLayout = () => {
  return (
    <div id="root">
      <div>two root layout</div>
      <Outlet />
    </div>
  );
};

export default MainLayout;
