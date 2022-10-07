import { useState, FC } from 'react';

const App: FC = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      Hello World. {count}{' '}
      <button onClick={() => setCount(c => c + 1)}>Count++</button>{' '}
    </div>
  );
};

export default App;
