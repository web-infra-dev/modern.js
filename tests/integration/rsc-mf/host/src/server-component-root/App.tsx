import 'server-only';
import { Suspense } from 'react';
import { AsyncRemoteServerInfo } from 'rscRemote/AsyncRemoteServerInfo';
import RemoteServerDefault from 'rscRemote/RemoteServerDefault';
import { incrementRemoteCount, remoteActionEcho } from 'rscRemote/actions';
import { defaultRemoteAction } from 'rscRemote/defaultAction';
import { nestedRemoteAction } from 'rscRemote/nestedActions';
import remoteMeta, { getRemoteMetaLabel } from 'rscRemote/remoteMeta';
import { getServerOnlyInfo } from 'rscRemote/remoteServerOnly';
import getServerOnlyDefaultInfo from 'rscRemote/remoteServerOnlyDefault';
import styles from './App.module.less';
import HostRemoteActionRunner from './HostRemoteActionRunner';
import {
  proxyDefaultRemoteAction,
  proxyIncrementRemoteCount,
  proxyNestedRemoteAction,
  proxyRemoteActionEcho,
} from './remoteActionProxy';

const getServerActionId = (action: unknown) =>
  (action as { $$id?: string } | undefined)?.$$id;

const App = () => {
  const remoteActionIdToHostProxyActionId = Object.fromEntries(
    [
      [
        getServerActionId(incrementRemoteCount),
        getServerActionId(proxyIncrementRemoteCount),
      ],
      [
        getServerActionId(remoteActionEcho),
        getServerActionId(proxyRemoteActionEcho),
      ],
      [
        getServerActionId(nestedRemoteAction),
        getServerActionId(proxyNestedRemoteAction),
      ],
      [
        getServerActionId(defaultRemoteAction),
        getServerActionId(proxyDefaultRemoteAction),
      ],
    ].filter((pair): pair is [string, string] => Boolean(pair[0] && pair[1])),
  );

  const remoteServerOnlyInfo = getServerOnlyInfo();
  const remoteServerOnlyDefaultInfo = getServerOnlyDefaultInfo();
  const remoteMetaLabel = getRemoteMetaLabel();

  return (
    <div className={styles.root}>
      <h1>Host RSC Module Federation</h1>
      <p className="host-remote-server-only">{remoteServerOnlyInfo}</p>
      <p className="host-remote-server-only-default">
        {remoteServerOnlyDefaultInfo}
      </p>
      <p className="host-remote-meta-kind">{remoteMeta.kind}</p>
      <p className="host-remote-meta-label">{remoteMetaLabel}</p>
      <Suspense fallback={<div>Loading Remote Async Server Info...</div>}>
        <AsyncRemoteServerInfo />
      </Suspense>
      <RemoteServerDefault label="Remote Default Server Card" />
      <Suspense fallback={<div>Loading Remote RSC...</div>}>
        <RemoteServerDefault label="Remote Federated Tree" />
      </Suspense>
      <div hidden>
        <form action={proxyIncrementRemoteCount} />
        <form action={proxyRemoteActionEcho} />
        <form action={proxyNestedRemoteAction} />
        <form action={proxyDefaultRemoteAction} />
      </div>
      <HostRemoteActionRunner
        remoteActionIdToHostProxyActionId={remoteActionIdToHostProxyActionId}
      />
    </div>
  );
};

export default App;
