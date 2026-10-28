import { Link } from '@modern-js/runtime/router';
export default function ProductList() {
  return (
    <section data-testid="scope-product-list">
      <h3>Weather products</h3>
      <Link data-testid="scope-detail-link" to="detail/42">
        Station 42
      </Link>
    </section>
  );
}
