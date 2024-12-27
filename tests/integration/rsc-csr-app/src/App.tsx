import 'server-only';
import { Suspense } from 'react';
import styles from './App.module.less';
import Suspended from './Suspended';
import { Counter } from './components/Counter';
import { getCountState } from './components/ServerState';

const App = () => {
  const countStateFromServer = getCountState();
  return (
    <div className={styles.root}>
      <Suspense fallback={<div>Loading...</div>}>
        <Suspended />
      </Suspense>
      <Counter />
      <div>countStateFromServer: {countStateFromServer}</div>
    </div>
  );
};

export default App;
