import { useLocation, useNavigate } from '@modern-js/runtime/router';
import { createReactRemote } from '@modern-js/runtime/mf';
import { useEffect, useState } from 'react';

const Product = createReactRemote({
  remote: 'provider/ProductApp',
  basename: '/admin/persistent/inventory',
});

export default function PersistentMount() {
  const location = useLocation();
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return (
    <main data-testid="persistent-root">
      <p data-testid="persistent-host-location">
        {location.pathname}
        {location.search}
        {hydrated && location.hash}
      </p>
      <button
        data-testid="persistent-exit"
        onClick={() => navigate('/persistent/outside')}
      >
        Leave inventory
      </button>
      <button
        data-testid="persistent-stay"
        onClick={() => navigate('/persistent/inventory/detail/42')}
      >
        Stay on this station
      </button>
      <Product />
    </main>
  );
}
