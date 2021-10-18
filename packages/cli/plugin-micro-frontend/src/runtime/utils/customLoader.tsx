import React, { memo } from 'react';
import { ModuleInfo } from '../typings';
import { SUBMODULE_APP_COMPONENT_KEY } from './constant';

type Provider = {
  render: () => void;
  destroy: () => void;
  [SUBMODULE_APP_COMPONENT_KEY]?: React.ComponentType<any>;
};

export function customLoader(
  setSubAppMap: Record<string, (...args: any[]) => any>,
) {
  return (provider: Provider, appInfo: ModuleInfo) => {
    const setSubApp = setSubAppMap[appInfo.name];
    const ModuleApp = provider[SUBMODULE_APP_COMPONENT_KEY];

    if (!ModuleApp || !setSubApp) {
      return {
        mount: provider.render,
        unmount: provider.destroy,
      };
    }

    return {
      mount() {
        setSubApp(() =>
          memo((props: any) => <ModuleApp {...appInfo.props} {...props} />),
        );
      },
      unmount() {
        setSubApp(null);
      },
    };
  };
}
