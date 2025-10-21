'use client';
import React, { Suspense, useState } from 'react';
import './Counter.css';

const DynamicMessage = React.lazy(() => import('./DynamicMessage'));

// Clean export for Module Federation - no server actions
export const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="client-component">
        Client State
        <p className="client-count">{count}</p>
        <button
          className="client-increment"
          onClick={() => setCount(count + 1)}
        >
          Increment
        </button>
      </div>
      <div className="client-component">
        Server State (from remote)
        <p className="server-count">0</p>
        <p className="info">Note: Server actions work when component is used in the consuming app's context</p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <DynamicMessage />
      </Suspense>
    </>
  );
};
