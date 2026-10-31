import { readDataScript } from '@modern-js/render/html';
import type React from 'react';
import { isBrowser } from '../../common';
import { ROUTER_DATA_JSON_ID, SSR_DATA_JSON_ID } from '../constants';
import { getGlobalApp, getGlobalInternalRuntimeContext } from '../context';

export function createRoot(UserApp?: React.ComponentType | null) {
  const App = UserApp || getGlobalApp();

  if (isBrowser()) {
    // we should get data from HTMLElement when set server.useJsonScript = true
    window._SSR_DATA = window._SSR_DATA || readInitialData(SSR_DATA_JSON_ID);

    window._ROUTER_DATA =
      window._ROUTER_DATA || readInitialData(ROUTER_DATA_JSON_ID);
  }

  const internalRuntimeContext = getGlobalInternalRuntimeContext();
  const hooks = internalRuntimeContext.hooks;
  /**
   * when use routes entry, after running router plugin, the App will be define
   */
  const WrapperApp = hooks.wrapRoot.call(App!);
  return WrapperApp;
}

function readInitialData<T>(id: string): T | undefined {
  try {
    return readDataScript<T>(document, { id, last: true });
  } catch (error) {
    console.error(`parse ${id} error`, error);
    return undefined;
  }
}
