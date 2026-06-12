import { useRuntimeContext } from '@modern-js/runtime';

const App = () => {
  const { context } = useRuntimeContext();
  if (context.isBrowser) {
    return <div>browser</div>;
  }
  return null;
};

export default App;
