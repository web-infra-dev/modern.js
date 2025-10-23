import 'server-only';
import { Suspense } from 'react';
// Ensure server actions are part of the server compilation graph
import './rsc-server-refs';
import styles from './App.module.less';
import Counter from './components/Counter';
import { getCountState } from './components/ServerState';
import Suspended from './components/Suspended';

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
