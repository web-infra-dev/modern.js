import { useState } from 'react';
import {
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from '@modern-js/runtime/router';
import { createReactRemote } from '@modern-js/runtime/mf';
const Card = createReactRemote<{ label: string }>({
  remote: 'provider/ProductApp',
  memoryRoute: { entryPath: '/' },
});
const Orders = createReactRemote({
  remote: 'provider/OrdersApp',
  memoryRoute: { entryPath: '/' },
});
export default function StoreLayout() {
  const [label, setLabel] = useState('Store products');
  const [mounted, setMounted] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { storeId } = useParams();
  const root = `/stores/${storeId}/inventory`;
  return (
    <main>
      <h1>Store inventory routing</h1>
      <p data-testid="route-host-location">
        {location.pathname}
        {location.search}
      </p>
      <button
        data-testid="route-host-detail"
        onClick={() => navigate(`${root}/detail/43?tab=price#chart`)}
      >
        Host detail
      </button>
      <button
        data-testid="route-host-slow"
        onClick={() => navigate(`${root}/detail/slow`)}
      >
        Slow station
      </button>
      <button
        data-testid="route-host-replace"
        onClick={() =>
          navigate(`${root}/detail/44?tab=replace#chart`, { replace: true })
        }
      >
        Host replace
      </button>
      <button
        data-testid="route-host-store"
        onClick={() =>
          navigate('/stores/200/inventory/detail/42?tab=stock#summary')
        }
      >
        Change store
      </button>
      <button
        data-testid="route-props"
        onClick={() => setLabel('Updated store products')}
      >
        Update props
      </button>
      <button
        data-testid="route-toggle"
        onClick={() => setMounted(value => !value)}
      >
        Toggle routed application
      </button>
      <section data-testid="route-main">
        <Outlet context={{ label, mounted }} />
      </section>
      <section data-testid="route-card-a">
        <Card label="Independent A" />
      </section>
      <section data-testid="route-card-b">
        <Card label="Independent B" />
      </section>
      <section data-testid="route-orders">
        <Orders />
      </section>
    </main>
  );
}
