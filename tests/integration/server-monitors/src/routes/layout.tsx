import { getMonitors, useRuntimeContext } from '@modern-js/runtime';
import { Outlet } from '@modern-js/runtime/router';

export default () => {
  const { context } = useRuntimeContext();
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
        monitors exist in useRuntimeContext: {exist ? 1 : 0}
      </div>
      <Outlet />
    </div>
  );
};
