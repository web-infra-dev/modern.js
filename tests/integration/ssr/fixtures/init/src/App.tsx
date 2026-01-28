import { RuntimeContext } from '@modern-js/runtime';
import { use } from 'react';

const App = () => {
  const { initialData } = use(RuntimeContext);

  return (
    <div className="text-center" id="data">
      Hello, Modern.js. env name: {(initialData?.name || '') as string}
    </div>
  );
};

export default App;
