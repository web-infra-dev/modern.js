import 'server-only';
import { Suspense } from 'react';
import { AsyncRemoteServerInfo } from 'rscRemote/AsyncRemoteServerInfo';
import { RemoteNestedMixed } from 'rscRemote/RemoteNestedMixed';
import RemoteServerDefault from 'rscRemote/RemoteServerDefault';
import { incrementRemoteCount, remoteActionEcho } from 'rscRemote/actions';
import defaultRemoteAction from 'rscRemote/defaultAction';
import { nestedRemoteAction } from 'rscRemote/nestedActions';
import remoteMeta, { getRemoteMetaLabel } from 'rscRemote/remoteMeta';
import { getServerOnlyInfo } from 'rscRemote/remoteServerOnly';
import getServerOnlyDefaultInfo from 'rscRemote/remoteServerOnlyDefault';
import styles from './App.module.less';
import HostRemoteActionRunner from './HostRemoteActionRunner';

const App = () => {
  // Keep remote server actions in the server graph so host RSC manifests
  // include action IDs needed for POST action resolution.
  void incrementRemoteCount;
  void nestedRemoteAction;
  void remoteActionEcho;
  void defaultRemoteAction;
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
        <RemoteNestedMixed label="Remote Federated Tree" />
      </Suspense>
      <HostRemoteActionRunner />
    </div>
  );
};

export default App;
