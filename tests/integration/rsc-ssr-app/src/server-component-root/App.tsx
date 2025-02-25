import 'server-only';
import { getRequest } from '@modern-js/runtime';
import { Suspense } from 'react';
import styles from './App.module.less';
import Suspended from './Suspended';
import { Counter } from './components/Counter';
import { getCountState } from './components/ServerState';

const App = ({ name }: { name: string }) => {
  const request = getRequest();
  console.log(typeof request?.url);
  const countStateFromServer = getCountState();
  return (
    <div className={styles.root}>
      <h1 data-testid="app-name">{name}</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <Suspended />
      </Suspense>
      <Counter />
      <div>countStateFromServer: {countStateFromServer}</div>
    </div>
  );
};

export default App;
