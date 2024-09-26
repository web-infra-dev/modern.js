import { Counter } from './Counter';

const App = ({ name }: { name: string }) => {
  return (
    <div
      id="root"
      style={{ border: '3px red dashed', margin: '1em', padding: '1em' }}
    >
      <h1 data-testid="app-name">{name}</h1>
      <Counter />
      <div>countFromServer</div>
    </div>
  );
};

export default App;
