import React, { memo } from 'react';
import { ModuleInfo } from '../typings';
import { SUBMODULE_APP_COMPONENT_KEY } from './constant';

type Provider = {
  render: () => void;
  destroy: () => void;
  [SUBMODULE_APP_COMPONENT_KEY]?: React.ComponentType<any>;
};

export function customLoader() {
  return (provider: Provider, appInfo: ModuleInfo) => {
    const ModuleApp = provider[SUBMODULE_APP_COMPONENT_KEY];

    if (!ModuleApp || !(appInfo as any)._setModuleApp) {
      return {
        mount: provider.render,
        unmount: provider.destroy,
      };
    }

    return {
      mount() {
        (appInfo as any)._setModuleApp(() =>
          memo((props: any) => <ModuleApp {...appInfo.props} {...props} />),
        );
      },
      unmount() {
        (appInfo as any)._setModuleApp(null);
      },
    };
  };
}
