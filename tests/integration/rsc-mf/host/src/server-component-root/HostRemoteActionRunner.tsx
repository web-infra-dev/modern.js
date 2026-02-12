'use client';

import { useState } from 'react';
import { remoteActionEcho } from 'rscRemote/actions';
import defaultRemoteAction from 'rscRemote/defaultAction';

export default function HostRemoteActionRunner() {
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
