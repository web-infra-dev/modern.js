'use client';

import { useState } from 'react';
import RemoteClientBadge from 'rscRemote/RemoteClientBadge';
import { RemoteClientCounter as RemoteClientCounterBridge } from 'rscRemote/RemoteClientCounter';
import { remoteActionEcho } from 'rscRemote/actions';
import defaultRemoteAction from 'rscRemote/defaultAction';
import { registerRemoteServerCallback } from 'rscRemote/registerServerCallback';

export default function HostRemoteActionRunner() {
  // Keep this import in the client graph so federated RSC bridge IDs
  // can map back to a concrete remote module factory at runtime.
  void RemoteClientCounterBridge;
  registerRemoteServerCallback(__RSC_MF_REMOTE_ORIGIN__);
  const [defaultResult, setDefaultResult] = useState('');
  const [echoResult, setEchoResult] = useState('');
  const [isPending, setIsPending] = useState(false);

  const runActions = async () => {
    setIsPending(true);
    try {
      const [defaultValue, echoValue] = await Promise.all([
        defaultRemoteAction('from-host-client'),
        remoteActionEcho('from-host-client'),
      ]);
      setDefaultResult(defaultValue);
      setEchoResult(echoValue);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="host-remote-action-runner">
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
    </div>
  );
}
