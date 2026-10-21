import { useState } from 'react';
import './style.css';
export default function Signal({ id = 'library-signal' }: { id?: string }) {
  const [count, setCount] = useState(0);
  return (
    <article className="library-signal" data-testid={id}>
      <small>Rslib remote · {process.env.MF_LAB_VERSION}</small>
      <h2>A different build. The same connection.</h2>
      <p>
        This component arrives from a library, without a Modern application.
      </p>
      <button
        data-testid={`${id}-counter`}
        onClick={() => setCount(value => value + 1)}
      >
        Signals received: {count}
      </button>
    </article>
  );
}
