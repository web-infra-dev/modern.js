import React, { useState } from 'react';
import { useRuntimeContext } from '@modern-js/runtime';

const App = () => {
  const [n] = useState(0);
  const { context } = useRuntimeContext();
  return (
    <React.Fragment>
      <div>{n}</div>
      <div>{String(context.request)}</div>
    </React.Fragment>
  );
};

export default App;
