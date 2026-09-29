import { Link, useRouteError } from '@modern-js/runtime/router';
import './product.css';
export default function ProductError() {
  const error = useRouteError();
  return (
    <section className="prd-app">
      <div className="prd-panel prd-empty" role="alert">
        <h1>商品暂时无法加载</h1>
        <p>
          {error instanceof Error
            ? error.message
            : '请检查商品是否存在，或稍后再试。'}
        </p>
        <Link className="prd-button" to="/">
          返回商品列表
        </Link>
        <button className="prd-button" onClick={() => window.location.reload()}>
          重新加载
        </button>
      </div>
    </section>
  );
}
