import { useLoaderData } from '@modern-js/runtime/router';
import React from 'react';

function App() {
  const data = useLoaderData() as { exist: boolean };

  return (
    <div>
      <div id="userSign">monitors exist in page user: {data.exist ? 1 : 0}</div>
    </div>
  );
}

export default App;
