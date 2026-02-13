'use client';

import { useEffect, useState } from 'react';
import RemoteClientBadge from 'rscRemote/RemoteClientBadge';
import { RemoteClientCounter as RemoteClientCounterBridge } from 'rscRemote/RemoteClientCounter';
import { remoteActionEcho } from 'rscRemote/actions';
import { defaultRemoteAction } from 'rscRemote/defaultAction';
import { registerRemoteServerCallback } from 'rscRemote/registerServerCallback';

const REMOTE_ACTION_ID_TO_HOST_PROXY_ACTION_ID = {
  '606c30f35d74d843171a8a71358eda595991e4ee16270e9f052af3faef57a19999':
    '603cd42bd1c9b98894c6d03b3b688f513073ddbea04bb02d7fda1e72c57f96b69d',
  '40e41a2ee9d9de373b364dcf2a0201701057c8502037bf9ef2cd26bb2a1259dabd':
    '40f14c24f6d81be75aab6d9dc7941b9507bfbdb9daca25df7b1aed34703972c7ab',
  '408da81ddb8214f8cb98a83552cb70c4d17b27b6fd36d972cac89e7030a4874fd4':
    '40928b48a8dc80bb3a73661fbdbeb14155a85a1b965e9ef67a8f4132bbd4dda7e5',
  '4019f2092c5baa86ad77fc144ce69129b81c38a1a6a1cb227a138b5d46de8977d7':
    '404768f4f5d65c3edafd60e28fc1252837ade49f3b06dad341098530dea5bb7716',
} as const;

export default function HostRemoteActionRunner() {
  // Keep this import in the client graph so federated RSC bridge IDs
  // can map back to a concrete remote module factory at runtime.
  void RemoteClientCounterBridge;
  const [defaultResult, setDefaultResult] = useState('');
  const [echoResult, setEchoResult] = useState('');
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    registerRemoteServerCallback(
      `${window.location.origin}/server-component-root`,
      'rscRemote',
      REMOTE_ACTION_ID_TO_HOST_PROXY_ACTION_ID as Record<string, string>,
    );
  }, []);

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
    </div>
  );
}
