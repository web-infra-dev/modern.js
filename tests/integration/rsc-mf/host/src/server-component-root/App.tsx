import 'server-only';
import { Suspense } from 'react';
import { RemoteNestedMixed } from 'rscRemote/RemoteNestedMixed';
import { getServerOnlyInfo } from 'rscRemote/remoteServerOnly';
import styles from './App.module.less';

const App = () => {
  const remoteServerOnlyInfo = getServerOnlyInfo();

  return (
    <div className={styles.root}>
      <h1>Host RSC Module Federation</h1>
      <p className="host-remote-server-only">{remoteServerOnlyInfo}</p>
      <Suspense fallback={<div>Loading Remote RSC...</div>}>
        <RemoteNestedMixed label="Remote Federated Tree" />
      </Suspense>
    </div>
  );
};

export default App;
