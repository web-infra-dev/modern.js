'use client';
import { useActionState, useEffect, useState } from 'react';
import './RemoteClientCounter.css';
import { incrementRemoteCount, remoteActionEcho } from './actions';
import { defaultRemoteAction } from './defaultAction';
import { nestedRemoteAction } from './nestedActions';
import { registerRemoteServerCallback } from './registerServerCallback';

export function RemoteClientCounter() {
  useEffect(() => {
    const actionPathname = window.location.pathname || '/';
    registerRemoteServerCallback(
      `${window.location.origin}${actionPathname}`,
      'rscRemote',
    );
  }, []);
  const [localCount, setLocalCount] = useState(0);
  const [serverCount, formAction, isPending] = useActionState(
    incrementRemoteCount,
    0,
  );
  const [nestedResult, setNestedResult] = useState('');
  const [remoteActionResult, setRemoteActionResult] = useState('');
  const [defaultActionResult, setDefaultActionResult] = useState('');

  const handleRunActions = async () => {
    const [nestedResultValue, remoteActionValue, defaultActionValue] =
      await Promise.all([
        nestedRemoteAction('from-client'),
        remoteActionEcho('from-client'),
        defaultRemoteAction('from-client'),
      ]);
    setNestedResult(nestedResultValue);
    setRemoteActionResult(remoteActionValue);
    setDefaultActionResult(defaultActionValue);
  };

  return (
    <div className="remote-client-counter">
      <h3>Remote Client Counter</h3>
      <p className="remote-client-local-count">{localCount}</p>
      <button
        className="remote-client-local-increment"
        onClick={() => setLocalCount(localCount + 1)}
      >
        Increment Local
      </button>
      <p className="remote-client-server-count">{serverCount}</p>
      <form action={formAction}>
        <input
          className="remote-client-server-input"
          defaultValue={1}
          name="count"
          type="number"
        />
        <button className="remote-client-server-increment" disabled={isPending}>
          {isPending ? 'Pending...' : 'Increment Server'}
        </button>
      </form>
      <button className="remote-client-run-actions" onClick={handleRunActions}>
        Run Nested Actions
      </button>
      <p className="remote-client-nested-result">{nestedResult}</p>
      <p className="remote-client-remote-action-result">{remoteActionResult}</p>
      <p className="remote-client-default-action-result">
        {defaultActionResult}
      </p>
    </div>
  );
}
