import { type RuntimeContext, useRuntimeContext } from '@modern-js/runtime';

const App = () => {
  const { initialData } = useRuntimeContext();

  return (
    <div className="text-center" id="data">
      Hello, Modern.js. env name: {(initialData?.name || '') as string}
    </div>
  );
};

export default App;
