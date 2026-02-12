'use client';
import { useActionState, useState } from 'react';
import './RemoteClientCounter.css';
import { incrementRemoteCount, remoteActionEcho } from './actions';
import { nestedRemoteAction } from './nestedActions';

export function RemoteClientCounter() {
  const [localCount, setLocalCount] = useState(0);
  const [serverCount, formAction, isPending] = useActionState(
    incrementRemoteCount,
    0,
  );
  const [nestedResult, setNestedResult] = useState('');
  const [remoteActionResult, setRemoteActionResult] = useState('');

  const handleRunActions = async () => {
    const [nestedResultValue, remoteActionValue] = await Promise.all([
      nestedRemoteAction('from-client'),
      remoteActionEcho('from-client'),
    ]);
    setNestedResult(nestedResultValue);
    setRemoteActionResult(remoteActionValue);
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
    </div>
  );
}
