import { Outlet } from '@modern-js/runtime/router';

export default () => {
  return (
    <div>
      B Layout
      <Outlet></Outlet>;
    </div>
  );
};
