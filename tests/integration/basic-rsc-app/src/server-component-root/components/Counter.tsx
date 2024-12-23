'use client';
import './Counter.css';
import { increment, incrementByForm } from './action';

import { useActionState, useState } from 'react';

export const Counter = () => {
  const [count, setCount] = useState(0);
  const [result, formAction, isPending] = useActionState(incrementByForm, 0);

  return (
    <>
      <div className="client-component" data-testid="counter-client">
        Client State
        <p data-testid="count">{count}</p>
        <button data-testid="increment" onClick={() => setCount(count + 1)}>
          Increment
        </button>
      </div>
      <div className="client-component">
        Server State
        <button data-testid="increment" onClick={() => increment(1)}>
          Increment
        </button>
        <p>{result}</p>
        <form action={formAction}>
          <input name="count" value={1} type="number" />
          <button data-testid="increment" disabled={isPending}>
            {isPending ? 'Loading...' : 'Increment'}
          </button>
        </form>
      </div>
    </>
  );
};
