import { Link } from '@modern-js/runtime/router';
import React from 'react';

const Page: React.FC = () => {
  return (
    <div>
      <div>Header Modifier</div>
      <p>
        Modifying headers of requests, useful for switch between traffic lanes.
      </p>
      <p>
        That will register{' '}
        <a href="/sw-proxy.js" target="_blank">
          /sw-proxy.js
        </a>{' '}
        as a service worker to handle requests.
        <Link to="./editor">
          <button>Enable</button>
        </Link>
      </p>
    </div>
  );
};

export default Page;
