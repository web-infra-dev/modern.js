import { Link, useLoaderData } from '@modern-js/runtime/router';
import React from 'react';

function App() {
  const data = useLoaderData() as { exist: boolean };

  return (
    <div>
      <div id="indexSign">
        monitors exist in page index: {data.exist ? 1 : 0}
      </div>
      <div>
        <Link to="/user" id="toUser">
          To Next Page
        </Link>
      </div>
    </div>
  );
}

export default App;
