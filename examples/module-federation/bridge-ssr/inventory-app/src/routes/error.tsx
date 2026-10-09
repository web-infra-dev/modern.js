import { Link, useRouteError } from '@modern-js/runtime/router';
import './inventory.css';
export default function InventoryError() {
  const error = useRouteError();
  return (
    <section className="inv-app">
      <div className="inv-panel inv-empty" role="alert">
        <h1>库存暂时无法加载</h1>
        <p>
          {error instanceof Error
            ? error.message
            : '请检查仓库选择，或稍后再试。'}
        </p>
        <Link className="inv-button" to="/">
          返回默认仓库
        </Link>
        <button className="inv-button" onClick={() => window.location.reload()}>
          重新加载
        </button>
      </div>
    </section>
  );
}
