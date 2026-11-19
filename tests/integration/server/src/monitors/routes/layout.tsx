import { RuntimeContext, getMonitors } from '@modern-js/runtime';
import { Outlet } from '@modern-js/runtime/router';
import { use } from 'react';

export default () => {
  const { context } = use(RuntimeContext);
  let exist = false;

  if (!context.isBrowser) {
    const monitors = getMonitors();
    exist = Boolean(monitors);
    monitors.warn('monitors in component');
  } else {
    exist = true;
  }

  return (
    <div>
      <div id="runtimeSign">
        monitors exist in RuntimeContext: {exist ? 1 : 0}
      </div>
      <Outlet />
    </div>
  );
};
