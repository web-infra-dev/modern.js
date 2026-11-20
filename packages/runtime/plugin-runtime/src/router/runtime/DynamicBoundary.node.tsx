import type React from 'react';
import { useContext } from 'react';
import { InternalRuntimeContext } from '../../core/context';
import { postpone } from '../../core/server/ppr/state';

/**
 * Wraps the element of a route with a data loader on a page using
 * `server.ssr.mode: 'ppr'`. While prerendering, the route has no loader data,
 * so the element is postponed and its `loading` component becomes part of the
 * prelude; the element itself renders when the request is served.
 */
const DynamicBoundary = ({ children }: { children?: React.ReactNode }) => {
  const { ssrContext } = useContext(InternalRuntimeContext);
  if (ssrContext?.ppr?.phase === 'prerender') {
    postpone();
  }
  return <>{children}</>;
};

export default DynamicBoundary;
