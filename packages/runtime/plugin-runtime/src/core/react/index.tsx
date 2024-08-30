import { parsedJSONFromElement } from '@modern-js/runtime-utils/parsed';
import type React from 'react';
import { isBrowser } from '../../common';
import { ROUTER_DATA_JSON_ID, SSR_DATA_JSON_ID } from '../constants';
import { getGlobalApp } from '../context';
import { getGlobalRunner } from '../plugin/runner';

export function createRoot(UserApp?: React.ComponentType | null) {
  const App = UserApp || getGlobalApp();

  if (isBrowser()) {
    // we should get data from HTMLElement when set ssr.inlineScript = false
    window._SSR_DATA =
      window._SSR_DATA || parsedJSONFromElement(SSR_DATA_JSON_ID);

    window._ROUTER_DATA =
      window._ROUTER_DATA || parsedJSONFromElement(ROUTER_DATA_JSON_ID);
  }

  const runner = getGlobalRunner();
  /**
   * when use routes entry, after running router plugin, the App will be define
   */
  const WrapperApp = runner.wrapRoot(App!);
  return WrapperApp;
}
