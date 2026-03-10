'use client';

import { Link } from '@modern-js/runtime/router';
import { useState } from 'react';
import './page.css';

export default function ClientOnlyPage() {
  const [count, setCount] = useState(0);
  return (
    <div className="client-only-page">
      <h1>Client Only Page</h1>
      <p className="client-only-text">This page is purely a client component</p>
      <p className="client-only-counter">Count: {count}</p>
      <button
        className="client-only-btn"
        type="button"
        onClick={() => setCount(c => c + 1)}
      >
        Increment
      </button>
      <Link className="home-link" to="/">
        Back to home
      </Link>
    </div>
  );
}
