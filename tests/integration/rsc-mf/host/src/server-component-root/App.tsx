import 'server-only';
import { Suspense } from 'react';
import { AsyncRemoteServerInfo } from 'rscRemote/AsyncRemoteServerInfo';
import RemoteServerDefault from 'rscRemote/RemoteServerDefault';
import * as remoteActionBundle from 'rscRemote/actionBundle';
import { incrementRemoteCount, remoteActionEcho } from 'rscRemote/actions';
import { defaultRemoteAction } from 'rscRemote/defaultAction';
import * as remoteInfoBundle from 'rscRemote/infoBundle';
import { nestedRemoteAction } from 'rscRemote/nestedActions';
import remoteMeta, { getRemoteMetaLabel } from 'rscRemote/remoteMeta';
import { getServerOnlyInfo } from 'rscRemote/remoteServerOnly';
import getServerOnlyDefaultInfo from 'rscRemote/remoteServerOnlyDefault';
import styles from './App.module.less';
import HostRemoteActionRunner from './HostRemoteActionRunner';
import {
  proxyBundledDefaultRemoteAction,
  proxyBundledIncrementRemoteCount,
  proxyBundledNestedRemoteAction,
  proxyBundledRemoteActionEcho,
  proxyDefaultRemoteAction,
  proxyIncrementRemoteCount,
  proxyNestedRemoteAction,
  proxyRemoteActionEcho,
} from './remoteActionProxy';

const getServerActionId = (action: unknown) =>
  (action as { $$id?: string } | undefined)?.$$id;

const App = () => {
  const hostProxyActionIds = [
    getServerActionId(proxyIncrementRemoteCount),
    getServerActionId(proxyRemoteActionEcho),
    getServerActionId(proxyNestedRemoteAction),
    getServerActionId(proxyDefaultRemoteAction),
    getServerActionId(proxyBundledIncrementRemoteCount),
    getServerActionId(proxyBundledRemoteActionEcho),
    getServerActionId(proxyBundledNestedRemoteAction),
    getServerActionId(proxyBundledDefaultRemoteAction),
  ].filter((actionId): actionId is string => Boolean(actionId));
  const uniqueHostProxyActionIdsCount = new Set(hostProxyActionIds).size;

  // Map remote action IDs to host-local proxy action IDs so client-side
  // callbacks can always post a host-resolvable action id. This keeps
  // remote action execution in-process on the host via proxy imports.
  const remoteActionIdToHostProxyActionEntries = [
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
    [
      getServerActionId(remoteActionBundle.bundledIncrementRemoteCount),
      getServerActionId(proxyBundledIncrementRemoteCount),
    ],
    [
      getServerActionId(remoteActionBundle.bundledRemoteActionEcho),
      getServerActionId(proxyBundledRemoteActionEcho),
    ],
    [
      getServerActionId(remoteActionBundle.bundledNestedRemoteAction),
      getServerActionId(proxyBundledNestedRemoteAction),
    ],
    [
      getServerActionId(remoteActionBundle.bundledDefaultRemoteAction),
      getServerActionId(proxyBundledDefaultRemoteAction),
    ],
  ].filter((pair): pair is [string, string] => Boolean(pair[0] && pair[1]));
  const remoteActionIdToHostProxyActionId = Object.fromEntries(
    remoteActionIdToHostProxyActionEntries,
  );
  const remoteActionIdMapKey = JSON.stringify(
    remoteActionIdToHostProxyActionEntries,
  );

  const remoteServerOnlyInfo = getServerOnlyInfo();
  const remoteServerOnlyDefaultInfo = getServerOnlyDefaultInfo();
  const remoteMetaLabel = getRemoteMetaLabel();
  const bundledServerOnlyInfo = remoteInfoBundle.getBundledServerOnlyInfo();
  const bundledServerOnlyDefaultInfo =
    remoteInfoBundle.getBundledServerOnlyDefaultInfo();
  const bundledRemoteMetaLabel = remoteInfoBundle.getBundledRemoteMetaLabel();

  return (
    <div className={styles.root}>
      <h1>Host RSC Module Federation</h1>
      <p className="host-remote-server-only">{remoteServerOnlyInfo}</p>
      <p className="host-remote-server-only-default">
        {remoteServerOnlyDefaultInfo}
      </p>
      <p className="host-remote-meta-kind">{remoteMeta.kind}</p>
      <p className="host-remote-meta-label">{remoteMetaLabel}</p>
      <p className="host-remote-bundled-server-only">{bundledServerOnlyInfo}</p>
      <p className="host-remote-bundled-server-only-default">
        {bundledServerOnlyDefaultInfo}
      </p>
      <p className="host-remote-bundled-meta-kind">
        {remoteInfoBundle.bundledRemoteMeta.kind}
      </p>
      <p className="host-remote-bundled-meta-label">{bundledRemoteMetaLabel}</p>
      <p className="host-proxy-action-id-count">
        {uniqueHostProxyActionIdsCount}
      </p>
      <Suspense fallback={<div>Loading Remote Async Server Info...</div>}>
        <AsyncRemoteServerInfo />
      </Suspense>
      <RemoteServerDefault label="Remote Default Server Card" />
      <Suspense fallback={<div>Loading Remote RSC...</div>}>
        <RemoteServerDefault label="Remote Federated Tree" />
      </Suspense>
      {/* Anchor host proxy actions in the server action manifest. */}
      <div hidden>
        <form action={proxyIncrementRemoteCount} />
        <form action={proxyRemoteActionEcho} />
        <form action={proxyNestedRemoteAction} />
        <form action={proxyDefaultRemoteAction} />
        <form action={proxyBundledIncrementRemoteCount} />
        <form action={proxyBundledRemoteActionEcho} />
        <form action={proxyBundledNestedRemoteAction} />
        <form action={proxyBundledDefaultRemoteAction} />
      </div>
      <HostRemoteActionRunner
        remoteActionIdMapKey={remoteActionIdMapKey}
        remoteActionIdToHostProxyActionId={remoteActionIdToHostProxyActionId}
      />
    </div>
  );
};

export default App;
