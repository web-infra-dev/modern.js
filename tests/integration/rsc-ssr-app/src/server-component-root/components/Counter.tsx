'use client';
import React, { Suspense } from 'react';
import './Counter.css';
import { useActionState, useState } from 'react';
import { increment, incrementByForm } from './action';

const DynamicMessage = React.lazy(() => import('./DynamicMessage'));

export const Counter = () => {
  const [count, setCount] = useState(0);
  const [inputValue, setInputValue] = useState(1);
  const [result, formAction, isPending] = useActionState(incrementByForm, 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(Number(e.target.value));
  };

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
        Server State
        <button onClick={() => increment(1)}>Increment</button>
        <p className="server-count">{result}</p>
        <form action={formAction}>
          <input
            name="count"
            value={inputValue}
            type="number"
            onChange={handleInputChange}
          />
          <button className="server-increment" disabled={isPending}>
            {isPending ? 'Loading...' : 'Increment'}
          </button>
        </form>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <DynamicMessage />
      </Suspense>
    </>
  );
};
