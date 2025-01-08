import 'server-only';
import { Suspense } from 'react';
import styles from './App.module.less';
import Suspended from './Suspended';
import { Counter } from './components/Counter';
import { getCountState } from './components/ServerState';
// import { increment } from './components/action';

// export async function greeting() {
//   'use server';
//   increment(6);
// }

const App = ({ name }: { name: string }) => {
  const countStateFromServer = getCountState();
  return (
    <div className={styles.root}>
      <h1 data-testid="app-name">{name}</h1>
      {/* <form action={greeting}>
        <button type="submit">Greeting</button>
      </form> */}
      <Suspense fallback={<div>Loading...</div>}>
        <Suspended />
      </Suspense>
      <Counter />
      <div>countStateFromServer: {countStateFromServer}</div>
    </div>
  );
};

export default App;
