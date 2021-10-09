import React from 'react';
import { useLoader } from '@modern-js/runtime';

const App = () => {
  const { data }: { data: { name: string } } = useLoader(
    async () =>
      new Promise(resolve =>
        setTimeout(() => resolve({ name: 'anchao' }), 2000),
      ),
    { params: 'fetch' },
  );

  return (
    <div>
      <h1>ssr demo1aaaaa11</h1>
      <p>{data?.name}</p>
    </div>
  );
};

export default App;
