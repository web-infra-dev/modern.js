import 'server-only';
import styles from './App.module.less';
import { Counter } from './components/Counter';
import { getCountState } from './components/ServerState';

const App = ({ name }: { name: string }) => {
  const countStateFromServer = getCountState();
  return (
    <div className={styles.root}>
      <h1 data-testid="app-name">{name}</h1>
      <Counter />
      <div>countStateFromServer: {countStateFromServer}</div>
    </div>
  );
};

export default App;
