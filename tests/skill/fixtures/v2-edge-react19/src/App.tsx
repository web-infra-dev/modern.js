import { useRuntimeContext } from '@modern-js/runtime';

const App = () => {
  const { context } = useRuntimeContext();
  return <div>{String(context.request)}</div>;
};

export default App;
