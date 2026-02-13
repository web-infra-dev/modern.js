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

const App = () => {
  const remoteActionIdToHostProxyActionId: Record<string, string> = {};
  const remoteIncrementActionId = (incrementRemoteCount as any)?.$$id;
  const remoteEchoActionId = (remoteActionEcho as any)?.$$id;
  const remoteNestedActionId = (nestedRemoteAction as any)?.$$id;
  const remoteDefaultActionId = (defaultRemoteAction as any)?.$$id;
  const proxyIncrementActionId = (proxyIncrementRemoteCount as any)?.$$id;
  const proxyEchoActionId = (proxyRemoteActionEcho as any)?.$$id;
  const proxyNestedActionId = (proxyNestedRemoteAction as any)?.$$id;
  const proxyDefaultActionId = (proxyDefaultRemoteAction as any)?.$$id;

  if (remoteIncrementActionId && proxyIncrementActionId) {
    remoteActionIdToHostProxyActionId[remoteIncrementActionId] =
      proxyIncrementActionId;
  }
  if (remoteEchoActionId && proxyEchoActionId) {
    remoteActionIdToHostProxyActionId[remoteEchoActionId] = proxyEchoActionId;
  }
  if (remoteNestedActionId && proxyNestedActionId) {
    remoteActionIdToHostProxyActionId[remoteNestedActionId] =
      proxyNestedActionId;
  }
  if (remoteDefaultActionId && proxyDefaultActionId) {
    remoteActionIdToHostProxyActionId[remoteDefaultActionId] =
      proxyDefaultActionId;
  }

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
      <div style={{ display: 'none' }}>
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
