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
  const directHostProxyActions = [
    proxyIncrementRemoteCount,
    proxyRemoteActionEcho,
    proxyNestedRemoteAction,
    proxyDefaultRemoteAction,
  ] as const;
  const bundledHostProxyActions = [
    proxyBundledIncrementRemoteCount,
    proxyBundledRemoteActionEcho,
    proxyBundledNestedRemoteAction,
    proxyBundledDefaultRemoteAction,
  ] as const;
  const hostProxyActions = [
    ...directHostProxyActions,
    ...bundledHostProxyActions,
  ] as const;
  const directHostProxyActionIds = directHostProxyActions
    .map(action => getServerActionId(action))
    .filter((actionId): actionId is string => Boolean(actionId));
  const bundledHostProxyActionIds = bundledHostProxyActions
    .map(action => getServerActionId(action))
    .filter((actionId): actionId is string => Boolean(actionId));
  const hostProxyActionIds = hostProxyActions
    .map(action => getServerActionId(action))
    .filter((actionId): actionId is string => Boolean(actionId));
  const uniqueHostProxyActionIds = Array.from(
    new Set(hostProxyActionIds),
  ).sort();
  const uniqueHostProxyActionIdsCount = uniqueHostProxyActionIds.length;

  // Map remote action IDs to host-local proxy action IDs so client-side
  // callbacks can always post a host-resolvable action id. This keeps
  // remote action execution in-process on the host via proxy imports.
  const remoteActionToHostProxyActionPairs = [
    [incrementRemoteCount, proxyIncrementRemoteCount],
    [remoteActionEcho, proxyRemoteActionEcho],
    [nestedRemoteAction, proxyNestedRemoteAction],
    [defaultRemoteAction, proxyDefaultRemoteAction],
    [
      remoteActionBundle.bundledIncrementRemoteCount,
      proxyBundledIncrementRemoteCount,
    ],
    [remoteActionBundle.bundledRemoteActionEcho, proxyBundledRemoteActionEcho],
    [
      remoteActionBundle.bundledNestedRemoteAction,
      proxyBundledNestedRemoteAction,
    ],
    [
      remoteActionBundle.bundledDefaultRemoteAction,
      proxyBundledDefaultRemoteAction,
    ],
  ] as const;
  const remoteActionIdToHostProxyActionEntries =
    remoteActionToHostProxyActionPairs
      .map(([remoteAction, hostProxyAction]) => [
        getServerActionId(remoteAction),
        getServerActionId(hostProxyAction),
      ])
      .filter((pair): pair is [string, string] => Boolean(pair[0] && pair[1]));
  const hostProxyActionDebugKeys = hostProxyActions.map(
    (action, index) =>
      [action, getServerActionId(action) ?? `proxy-action-${index}`] as const,
  );
  const hostProxyManifestForms = hostProxyActionDebugKeys.map(
    ([action, actionId]) => <form action={action} key={actionId} />,
  );
  const remoteActionIdToHostProxyActionId = Object.fromEntries(
    remoteActionIdToHostProxyActionEntries,
  );
  const remoteActionIdMapKeyCount = Object.keys(
    remoteActionIdToHostProxyActionId,
  ).length;
  const remoteActionIdMapKey = JSON.stringify(
    Object.entries(remoteActionIdToHostProxyActionId).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
  const remoteActionIdMapEntryCount =
    remoteActionIdToHostProxyActionEntries.length;
  const remoteActionIdMapCollisionCount = Math.max(
    remoteActionIdMapEntryCount - remoteActionIdMapKeyCount,
    0,
  );
  const mappedHostProxyActionIds = Array.from(
    new Set(Object.values(remoteActionIdToHostProxyActionId)),
  ).sort();
  const doesMappingCoverAllHostProxyActions =
    mappedHostProxyActionIds.length <= uniqueHostProxyActionIds.length &&
    mappedHostProxyActionIds.every(actionId =>
      uniqueHostProxyActionIds.includes(actionId),
    );
  const doesMappingExactlyMatchAllHostProxyActions =
    mappedHostProxyActionIds.length === uniqueHostProxyActionIds.length &&
    mappedHostProxyActionIds.every(
      (actionId, index) => actionId === uniqueHostProxyActionIds[index],
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
      <p className="host-proxy-map-entry-count">
        {remoteActionIdMapEntryCount}
      </p>
      <p className="host-proxy-map-key-count">{remoteActionIdMapKeyCount}</p>
      <p className="host-proxy-map-collision-count">
        {remoteActionIdMapCollisionCount}
      </p>
      <p className="host-mapped-proxy-action-ids">
        {mappedHostProxyActionIds.join(',')}
      </p>
      <p className="host-proxy-map-covers-all">
        {String(doesMappingCoverAllHostProxyActions)}
      </p>
      <p className="host-proxy-map-equals-all">
        {String(doesMappingExactlyMatchAllHostProxyActions)}
      </p>
      <p className="host-proxy-action-ids">
        {uniqueHostProxyActionIds.join(',')}
      </p>
      <p className="host-direct-proxy-action-ids">
        {directHostProxyActionIds.join(',')}
      </p>
      <p className="host-bundled-proxy-action-ids">
        {bundledHostProxyActionIds.join(',')}
      </p>
      <Suspense fallback={<div>Loading Remote Async Server Info...</div>}>
        <AsyncRemoteServerInfo />
      </Suspense>
      <RemoteServerDefault label="Remote Default Server Card" />
      <Suspense fallback={<div>Loading Remote RSC...</div>}>
        <RemoteServerDefault label="Remote Federated Tree" />
      </Suspense>
      {/* Anchor host proxy actions in the server action manifest. */}
      <div hidden>{hostProxyManifestForms}</div>
      <HostRemoteActionRunner
        remoteActionIdMapKey={remoteActionIdMapKey}
        remoteActionIdToHostProxyActionId={remoteActionIdToHostProxyActionId}
      />
    </div>
  );
};

export default App;
