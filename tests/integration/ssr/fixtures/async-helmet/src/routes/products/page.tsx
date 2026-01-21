import { Helmet } from '@modern-js/runtime/head';

export default function Products() {
  return (
    <div>
      <Helmet>
        <title>Products - Async Helmet Test</title>
        <meta
          name="description"
          content="Products page for async helmet test"
        />
        <link rel="canonical" href="http://localhost/products" />
      </Helmet>
      <h1>Products Page</h1>
      <ul>
        <li>Product 1</li>
        <li>Product 2</li>
        <li>Product 3</li>
      </ul>
      <div id="products-list">Products list loaded</div>
    </div>
  );
}
