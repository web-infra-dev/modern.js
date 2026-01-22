import { Helmet } from '@modern-js/runtime/head';
import { Await, Outlet, defer, useLoaderData } from '@modern-js/runtime/router';
import { Suspense } from 'react';
import type { ProductInfo } from './page.data';

export default function Products() {
  const { productInfo } = useLoaderData() as {
    productInfo: Promise<ProductInfo>;
  };
  return (
    <div>
      <Suspense fallback={<div>Loading product info...</div>}>
        <Await resolve={productInfo}>
          {(data: ProductInfo) => (
            <>
              <Helmet>
                <title>{data.title}</title>
                <meta name="description" content={data.description} />
                <link rel="canonical" href="http://localhost/products" />
              </Helmet>
              <h1>Products Page</h1>
              <ul>
                <li>Product 1</li>
                <li>Product 2</li>
                <li>Product 3</li>
              </ul>
              <div id="products-list">Products list loaded</div>
            </>
          )}
        </Await>
      </Suspense>
    </div>
  );
}
