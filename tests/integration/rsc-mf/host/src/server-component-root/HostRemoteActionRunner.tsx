'use client';

import { useEffect, useState } from 'react';
import RemoteClientBadge from 'rscRemote/RemoteClientBadge';
import { RemoteClientCounter as RemoteClientCounterBridge } from 'rscRemote/RemoteClientCounter';
import * as remoteActionBundle from 'rscRemote/actionBundle';
import { remoteActionEcho } from 'rscRemote/actions';
import { defaultRemoteAction } from 'rscRemote/defaultAction';
import { registerRemoteServerCallback } from 'rscRemote/registerServerCallback';

export default function HostRemoteActionRunner({
  remoteActionIdToHostProxyActionId,
}: {
  remoteActionIdToHostProxyActionId: Record<string, string>;
}) {
  // Keep this import in the client graph so federated RSC bridge IDs
  // can map back to a concrete remote module factory at runtime.
  void RemoteClientCounterBridge;
  const [defaultResult, setDefaultResult] = useState('');
  const [echoResult, setEchoResult] = useState('');
  const [bundledDefaultResult, setBundledDefaultResult] = useState('');
  const [bundledEchoResult, setBundledEchoResult] = useState('');
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    // Register once with host endpoint + id mapping so remote client-side
    // server actions are routed through host proxy actions.
    registerRemoteServerCallback(
      `${window.location.origin}/server-component-root`,
      'rscRemote',
      remoteActionIdToHostProxyActionId,
    );
  }, [JSON.stringify(remoteActionIdToHostProxyActionId)]);

  const runActions = async () => {
    setIsPending(true);
    try {
      const [defaultValue, echoValue, bundledDefaultValue, bundledEchoValue] =
        await Promise.all([
          defaultRemoteAction('from-host-client'),
          remoteActionEcho('from-host-client'),
          remoteActionBundle.bundledDefaultRemoteAction(
            'from-host-client-bundled',
          ),
          remoteActionBundle.bundledRemoteActionEcho(
            'from-host-client-bundled',
          ),
        ]);
      setDefaultResult(defaultValue);
      setEchoResult(echoValue);
      setBundledDefaultResult(bundledDefaultValue);
      setBundledEchoResult(bundledEchoValue);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="host-remote-action-runner">
      <RemoteClientCounterBridge />
      <RemoteClientBadge initialLabel="remote-client-badge-initial" />
      <button
        className="host-remote-run-actions"
        disabled={isPending}
        onClick={runActions}
      >
        {isPending ? 'Running...' : 'Run Host Remote Actions'}
      </button>
      <p className="host-remote-default-action-result">{defaultResult}</p>
      <p className="host-remote-echo-action-result">{echoResult}</p>
      <p className="host-remote-bundled-default-action-result">
        {bundledDefaultResult}
      </p>
      <p className="host-remote-bundled-echo-action-result">
        {bundledEchoResult}
      </p>
    </div>
  );
}
