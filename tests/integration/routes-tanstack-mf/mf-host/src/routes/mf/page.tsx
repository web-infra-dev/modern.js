import { loadRemote } from '@module-federation/modern-js/runtime';
import { useMatch } from '@modern-js/runtime/tanstack-router';
import * as React from 'react';

const RemoteWidget = React.lazy(async () => {
  const mod: any = await loadRemote('remote/Widget');
  return {
    default: mod.default || mod.Widget,
  };
});

const RemoteMutator = React.lazy(async () => {
  const mod: any = await loadRemote('remote/Mutator');
  return {
    default: mod.default || mod.Mutator,
  };
});

export default function MfPage() {
  const match = useMatch({ from: '/mf' });
  const msg = match.loaderData!.msg;
  const count = match.loaderData!.count;

  return (
    <div id="mf">
      <div id="host-loader">{msg}</div>
      <div id="host-mf-count">host-mf-count:{count}</div>
      {typeof window === 'undefined' ? (
        <>
          <div id="remote-ssr-placeholder">remote-widget:pending</div>
          <div id="remote-mutator-ssr-placeholder">remote-mutator:pending</div>
        </>
      ) : (
        <>
          <React.Suspense fallback={<div id="remote-loading">loading</div>}>
            <RemoteWidget />
          </React.Suspense>
          <React.Suspense fallback={<div id="remote-mutator-loading">loading</div>}>
            <RemoteMutator />
          </React.Suspense>
        </>
      )}
    </div>
  );
}
