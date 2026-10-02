import { useContext } from 'react';
import { useRuntimeContext, RuntimeContext } from '@modern-js/runtime';

const App = () => {
  const { context } = useRuntimeContext();
  return <div>{String(context.request)}</div>;
};

export default App;
