import { useState } from 'react';
export default function Ping() {
  const [count, setCount] = useState(0);
  return (
    <button
      data-testid="relay-ping"
      onClick={() => setCount(value => value + 1)}
    >
      Relay pings: {count}
    </button>
  );
}
