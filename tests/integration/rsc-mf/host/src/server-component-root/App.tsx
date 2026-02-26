import 'server-only';
import { Suspense } from 'react';
import { AsyncRemoteServerInfo } from 'rscRemote/AsyncRemoteServerInfo';
import RemoteServerDefault from 'rscRemote/RemoteServerDefault';
import * as remoteInfoBundle from 'rscRemote/infoBundle';
import remoteMeta, { getRemoteMetaLabel } from 'rscRemote/remoteMeta';
import { getServerOnlyInfo } from 'rscRemote/remoteServerOnly';
import getServerOnlyDefaultInfo from 'rscRemote/remoteServerOnlyDefault';
import styles from './App.module.less';
import HostRemoteActionRunner from './HostRemoteActionRunner';

const App = () => {
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
      <Suspense fallback={<div>Loading Remote Async Server Info...</div>}>
        <AsyncRemoteServerInfo />
      </Suspense>
      <RemoteServerDefault label="Remote Default Server Card" />
      <Suspense fallback={<div>Loading Remote RSC...</div>}>
        <RemoteServerDefault label="Remote Federated Tree" />
      </Suspense>
      <HostRemoteActionRunner />
    </div>
  );
};

export default App;
