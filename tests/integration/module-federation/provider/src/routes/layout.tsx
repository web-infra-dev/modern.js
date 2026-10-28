import { Link, Outlet, useLoaderData } from '@modern-js/runtime/router';
import { useState } from 'react';
export default function Layout({
  label = 'Weather application',
}: {
  label?: string;
}) {
  const data = useLoaderData() as { root: string };
  const [count, setCount] = useState(0);
  return (
    <main data-testid="scope-root">
      <h2>{label}</h2>
      <p data-testid="scope-root-data">{data.root}</p>
      <button
        data-testid="scope-count"
        onClick={() => setCount(value => value + 1)}
      >
        Observations: {count}
      </button>
      <nav>
        <Link to="/product" data-testid="scope-product-link">
          Products
        </Link>{' '}
        <Link to="/orders" data-testid="scope-orders-link">
          Orders
        </Link>
      </nav>
      <Outlet />
    </main>
  );
}
