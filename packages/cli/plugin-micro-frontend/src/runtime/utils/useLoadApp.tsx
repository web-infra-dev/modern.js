import { useRouteMatch } from '@modern-js/plugin-router';

import garfish from 'garfish';
import { ModuleInfo } from '../typings';

export default function useLoadApp(params: {
  usingGarfishRouter: boolean;
  basename: string;
  domId: string;
}) {
  const { usingGarfishRouter, basename = '', domId } = params;
  const matched = useRouteMatch();

  return async (moduleInfo: ModuleInfo) => {
    const options = {
      domGetter: `#${domId}`,
      basename: usingGarfishRouter
        ? basename + moduleInfo.activeWhen
        : basename + matched?.url || '',
      cache: true,
    };

    const app = await garfish.loadApp(moduleInfo.name, options);

    if (!app) {
      throw new Error(
        `${moduleInfo.name} loaded error, moduleInfo: ${JSON.stringify(
          moduleInfo,
        )}, options: ${JSON.stringify(options)}`,
      );
    }

    let { mount, unmount } = app;

    mount = mount.bind(app);
    unmount = unmount.bind(app);

    return { mount, unmount, app };
  };
}
