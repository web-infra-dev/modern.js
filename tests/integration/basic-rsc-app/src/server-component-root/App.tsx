import 'server-only';
import styles from './App.module.less';
import { Counter } from './components/Counter';
import { getCountState } from './components/ServerState';

const App = ({ name }: { name: string }) => {
  const countStateFromServer = getCountState();
  return (
    <div
      id="root"
      className={styles.root}
      style={{ border: '3px red dashed', margin: '1em', padding: '1em' }}
    >
      <h1 data-testid="app-name">{name}</h1>
      <Counter />
      <div>countStateFromServer: {countStateFromServer}</div>
    </div>
  );
};

export default App;
