import React, { useState } from 'react';

export const App = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      Hello World. {count}{' '}
      <button onClick={() => setCount(c => c + 1)}>Count++</button>{' '}
    </div>
  );
};
