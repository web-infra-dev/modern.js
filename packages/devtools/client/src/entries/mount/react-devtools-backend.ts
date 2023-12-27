import { initialize } from 'react-devtools-inline/backend';

if (!window.opener) {
  try {
    // Delete existing devtools hooks registered by react devtools extension.
    try {
      // @ts-expect-error
      delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    } catch {}
    // Call this before importing React (or any other packages that might import React).
    initialize(window);
    // Deny react devtools extension to activate.
    const originSubHook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.sub;
    // @ts-expect-error
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.sub = (e: any, handler) => {
      if (e === 'devtools-backend-installed') {
        return undefined;
      }
      return originSubHook(e, handler);
    };
  } catch (err) {
    const e = new Error('Failed to inject React DevTools backend.');
    e.cause = err;
    console.error(e);
  }
}
