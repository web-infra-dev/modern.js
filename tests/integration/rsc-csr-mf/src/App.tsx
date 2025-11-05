'use client';
import { Suspense } from 'react';
import styles from './App.module.less';
import Counter from './components/Counter';
import Suspended from './components/Suspended';

const App = () => {
  // CSR mode: use hard-coded initial state (no server-side getCountState)
  const countStateFromServer = 0;
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
