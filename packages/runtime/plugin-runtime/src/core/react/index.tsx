import React from 'react';
import { getGlobalApp } from '../context';
import { getGlobalRunner } from '../plugin/runner';

export function createRoot(UserApp?: React.ComponentType | null) {
  const App = UserApp || getGlobalApp();

  const runner = getGlobalRunner();
  /**
   * when use routes entry, after running router plugin, the App will be define
   */
  const WrapperApp = runner.wrapRoot(App!);
  const WrapComponent = (props: any) => {
    return <WrapperApp {...props} />;
  };
  return WrapComponent;
}
