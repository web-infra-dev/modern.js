import type { SetupClientParams } from './mount-point';

export const RUNTIME_GLOBALS = '__modern_js_global';

export interface RuntimeGlobals {
  options?: SetupClientParams;
}

declare global {
  interface Window {
    [RUNTIME_GLOBALS]?: RuntimeGlobals;
  }
}

export const globals = {
  get options() {
    window[RUNTIME_GLOBALS] ||= {};
    const { options } = window[RUNTIME_GLOBALS];
    if (!options || typeof options !== 'object') {
      throw new TypeError(
        `Unexpected type of window.${RUNTIME_GLOBALS}.options.`,
      );
    }
    return options;
  },
  set options(value: SetupClientParams) {
    window[RUNTIME_GLOBALS] ||= {};
    window[RUNTIME_GLOBALS].options = value;
  },
};
