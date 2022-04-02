/* eslint-disable no-console */
import React, { useState } from 'react';
import { useLoader } from '@modern-js/runtime';

function App() {
  const [count, setCount] = useState(0);

  const { data, loading, reload } = useLoader(
    async (context, params) => {
      console.log(`useLoader exec with params: ${params}`);
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(params);
        }, 10);
      });
    },
    {
      onSuccess: _data => {
        console.log(`useLoader success ${_data}`);
      },
      onError: _error => {
        console.log(`useLoader error ${_error}`);
      },
      initialData: 'nicole',
      params: count,
    },
  );

  if (loading) {
    return 'Loading...';
  }

  const handleAdd = () => {
    setCount(pre => pre + 1);
  };

  const handleReload = () => {
    reload();
  };

  const handleLoadUpdate = () => {
    reload(100);
  };

  return (
    <div>
      <div id="data">{data}</div>
      <button id="add" type="button" onClick={handleAdd}>
        Add
      </button>
      <button id="reload" type="button" onClick={handleReload}>
        Reload
      </button>
      <button id="update" type="button" onClick={handleLoadUpdate}>
        Load update
      </button>
    </div>
  );
}

export default App;
/* eslint-enable no-console */
