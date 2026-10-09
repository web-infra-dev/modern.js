import { useLocation } from '@modern-js/runtime/router';
import { createRemoteAppComponent } from '@module-federation/modern-js-v3/react';
import { loadRemote } from '@module-federation/modern-js-v3/runtime';

const loading = (
  <output className="app-loading">
    <span className="loading-line" />
    <span className="loading-line short" />
    <span className="loading-table" />
    正在加载工作区…
  </output>
);
const fallback = ({ error }: { error: unknown }) => (
  <div className="app-error" role="alert">
    <h3>工作区暂时无法打开</h3>
    <p>{error instanceof Error ? error.message : String(error)}</p>
    <button onClick={() => window.location.reload()}>重新加载</button>
  </div>
);
const Products = createRemoteAppComponent({
  loader: () => loadRemote('products/App'),
  loading,
  fallback,
});
const Inventory = createRemoteAppComponent({
  loader: () => loadRemote('inventory/App'),
  loading,
  fallback,
});

export function ProductApplication({
  entryPath = '/',
}: { entryPath?: string }) {
  const location = useLocation();
  return (
    <Products
      basename="/"
      memoryRoute={{ entryPath: entryPath + location.search }}
    />
  );
}
export function InventoryApplication() {
  const location = useLocation();
  return (
    <Inventory
      basename="/"
      memoryRoute={{ entryPath: `/${location.search}` }}
    />
  );
}
