import { useRuntimeContext as useCtx } from '@modern-js/runtime';

const App = () => {
  const { context } = useCtx();
  return <div>{String(context.request)}</div>;
};

export default App;
