import { Outlet } from '@modern-js/runtime/router';

export default () => {
  return (
    <div>
      <Outlet />
    </div>
  );
};

export const init = () => {
  return {
    data: 'init data',
  };
};
