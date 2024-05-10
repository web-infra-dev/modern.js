import { Link } from '@modern-js/runtime/router';
import { useState } from 'react';

const Index = (): JSX.Element => {
  const [count, setCount] = useState(0);
  return (
    <div>
      <h1>Hello, Modern.js!</h1>
      <div>
        <button onClick={() => setCount(count - 1)}>-</button>
        <span>{count}</span>
        <button onClick={() => setCount(count + 1)}>+</button>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Link to="user">User</Link>
        <a href="/devtools">DevTools</a>
        <a href="/admin">Admin</a>
      </div>
    </div>
  );
};

export default Index;
