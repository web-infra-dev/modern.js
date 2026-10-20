import { useState } from 'react';
export default function Pulse() {
  const [count, setCount] = useState(0);
  return (
    <button
      data-testid="relay-pulse"
      onClick={() => setCount(value => value + 1)}
    >
      Local pulses: {count}
    </button>
  );
}
