import { Hookable } from 'hookable';
import { Tab } from './node';

declare global {
  interface Window {
    [RUNTIME_GLOBALS]?: RuntimeGlobals;
  }
}

export const RUNTIME_GLOBALS = '__modern_js_global';

export interface GlobalHooks {
  'tab:list': (tabs: Tab[]) => void;
}

export type RuntimeGlobals = Hookable<GlobalHooks>;

export const getRuntimeGlobals = () => {
  const globals = window[RUNTIME_GLOBALS];
  if (!globals || typeof globals !== 'object') {
    throw TypeError('RuntimeGlobals is not initialized');
  }
  return globals;
};
