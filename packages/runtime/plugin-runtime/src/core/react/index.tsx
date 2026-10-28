import { parsedJSONFromElement } from '@modern-js/runtime-utils/parsed';
import type React from 'react';
import { isBrowser } from '../../common';
import { ROUTER_DATA_JSON_ID, SSR_DATA_JSON_ID } from '../constants';
import { getGlobalApp, getGlobalInternalRuntimeContext } from '../context';

export interface CreateRootOptions {
  route?: string;
}

export function createRoot(
  options?: CreateRootOptions,
): React.ComponentType<any>;
export function createRoot(
  UserApp?: React.ComponentType | null,
): React.ComponentType<any>;
export function createRoot(
  UserApp?: React.ComponentType | CreateRootOptions | null,
) {
  if (UserApp && typeof UserApp === 'object' && !('$$typeof' in UserApp)) {
    if (UserApp.route !== undefined) {
      throw new Error(
        'createRoot({ route }) must be statically defined in a Modern Module Federation expose with a registry import.',
      );
    }
    UserApp = undefined;
  }
  const App = (UserApp || getGlobalApp()) as React.ComponentType | undefined;

  if (isBrowser()) {
    // we should get data from HTMLElement when set server.useJsonScript = true
    window._SSR_DATA =
      window._SSR_DATA || parsedJSONFromElement(SSR_DATA_JSON_ID);

    window._ROUTER_DATA =
      window._ROUTER_DATA || parsedJSONFromElement(ROUTER_DATA_JSON_ID);
  }

  const internalRuntimeContext = getGlobalInternalRuntimeContext();
  const hooks = internalRuntimeContext.hooks;
  /**
   * when use routes entry, after running router plugin, the App will be define
   */
  const WrapperApp = hooks.wrapRoot.call(App!);
  return WrapperApp;
}
