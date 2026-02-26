'use client';

import { useState } from 'react';
import RemoteClientBadge from 'rscRemote/RemoteClientBadge';
import { RemoteClientCounter as RemoteClientCounterBridge } from 'rscRemote/RemoteClientCounter';
import * as remoteActionBundle from 'rscRemote/actionBundle';
import { incrementRemoteCount, remoteActionEcho } from 'rscRemote/actions';
import { defaultRemoteAction } from 'rscRemote/defaultAction';
import { nestedRemoteAction } from 'rscRemote/nestedActions';

export default function HostRemoteActionRunner() {
  const [defaultResult, setDefaultResult] = useState('');
  const [echoResult, setEchoResult] = useState('');
  const [nestedResult, setNestedResult] = useState('');
  const [incrementResult, setIncrementResult] = useState('');
  const [bundledDefaultResult, setBundledDefaultResult] = useState('');
  const [bundledEchoResult, setBundledEchoResult] = useState('');
  const [bundledNestedResult, setBundledNestedResult] = useState('');
  const [bundledIncrementResult, setBundledIncrementResult] = useState('');
  const [isPending, setIsPending] = useState(false);

  const runActions = async () => {
    setIsPending(true);
    try {
      const directIncrementFormData = new FormData();
      directIncrementFormData.set('count', '1');
      const bundledIncrementFormData = new FormData();
      bundledIncrementFormData.set('count', '1');
      const [
        defaultValue,
        echoValue,
        nestedValue,
        bundledDefaultValue,
        bundledEchoValue,
        bundledNestedValue,
      ] = await Promise.all([
        defaultRemoteAction('from-host-client'),
        remoteActionEcho('from-host-client'),
        nestedRemoteAction('from-host-client-direct'),
        remoteActionBundle.bundledDefaultRemoteAction(
          'from-host-client-bundled',
        ),
        remoteActionBundle.bundledRemoteActionEcho('from-host-client-bundled'),
        remoteActionBundle.bundledNestedRemoteAction(
          'from-host-client-bundled',
        ),
      ]);
      const directIncrementValue = await incrementRemoteCount(
        0,
        directIncrementFormData,
      );
      const bundledIncrementValue =
        await remoteActionBundle.bundledIncrementRemoteCount(
          0,
          bundledIncrementFormData,
        );
      setDefaultResult(defaultValue);
      setEchoResult(echoValue);
      setNestedResult(nestedValue);
      setIncrementResult(String(directIncrementValue));
      setBundledDefaultResult(bundledDefaultValue);
      setBundledEchoResult(bundledEchoValue);
      setBundledNestedResult(bundledNestedValue);
      setBundledIncrementResult(String(bundledIncrementValue));
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
      <p className="host-remote-nested-action-result">{nestedResult}</p>
      <p className="host-remote-increment-action-result">{incrementResult}</p>
      <p className="host-remote-bundled-default-action-result">
        {bundledDefaultResult}
      </p>
      <p className="host-remote-bundled-echo-action-result">
        {bundledEchoResult}
      </p>
      <p className="host-remote-bundled-nested-action-result">
        {bundledNestedResult}
      </p>
      <p className="host-remote-bundled-increment-action-result">
        {bundledIncrementResult}
      </p>
    </div>
  );
}
