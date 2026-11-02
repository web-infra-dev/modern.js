import { useState } from 'react';
import { createReactRemote } from '@modern-js/runtime/mf';

const WeatherApp = createReactRemote<{ label: string }>({
  remote: 'provider/WeatherApp',
  memoryRoute: { entryPath: '/' },
});
const ProductApp = createReactRemote<{ label: string }>({
  remote: 'provider/ProductApp',
  memoryRoute: { entryPath: '/' },
});
const ProductEntry = createReactRemote({
  remote: 'provider/ProductApp',
  memoryRoute: { entryPath: '/detail/45?tab=memory#start' },
});
const OrdersApp = createReactRemote<{ label: string }>({
  remote: 'provider/OrdersApp',
  memoryRoute: { entryPath: '/' },
});

export default function RouteExports() {
  const [label, setLabel] = useState('Lakeside products');
  const [mounted, setMounted] = useState(true);
  return (
    <main>
      <h1>Weather application exports</h1>
      <button
        data-testid="scope-rename"
        onClick={() => setLabel('Hilltop products')}
      >
        Rename first product station
      </button>
      <button
        data-testid="scope-toggle"
        onClick={() => setMounted(value => !value)}
      >
        Toggle first product station
      </button>
      <section data-testid="app-all">
        <WeatherApp label="Whole weather application" />
      </section>
      <section data-testid="app-product-a">
        {mounted && <ProductApp label={label} />}
      </section>
      <section data-testid="app-product-b">
        <ProductApp label="Riverside products" />
      </section>
      <section data-testid="app-product-entry">
        <ProductEntry />
      </section>
      <section data-testid="app-orders">
        <OrdersApp label="Weather orders" />
      </section>
    </main>
  );
}
