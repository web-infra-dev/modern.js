import { useState } from 'react';
import radar from './signal.svg';
import styles from './signal.module.css';
const version = process.env.MF_LAB_VERSION || 'v1';
export default function Signal({ id = 'signal' }: { id?: string }) {
  const [count, setCount] = useState(0);
  return (
    <article className={styles.signal} data-testid={id}>
      <img src={radar} alt="" data-testid={`${id}-image`} />
      <small>Modern remote · {version}</small>
      <h2>A signal from another origin.</h2>
      <p>Independent build. Shared experience.</p>
      <button
        data-testid={`${id}-counter`}
        onClick={() => setCount(value => value + 1)}
      >
        Signals received: {count}
      </button>
    </article>
  );
}
