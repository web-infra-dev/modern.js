import { useContext } from 'react';
import { createPlugin, RuntimeReactContext } from '@modern-js/runtime-core';
import { initFetch, ModernFetch } from './fetch';

declare module '@modern-js/runtime-core' {
  interface RuntimeContext {
    // TODO: FIXME
    SSRContext: any;
    fetch: ModernFetch;
  }
}

export const fetchPlugin: any = createPlugin(() => ({
  init: ({ context }, next) => {
    const fetch = initFetch(context?.SSRContext || {});
    context.fetch = fetch;
    return next({ context });
  },
}));

export const useFetch = () => {
  const runtimeContext = useContext(RuntimeReactContext);

  return runtimeContext.fetch;
};
