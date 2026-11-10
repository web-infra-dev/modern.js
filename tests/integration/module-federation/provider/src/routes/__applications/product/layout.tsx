import { Link, Outlet, useLoaderData } from '@modern-js/runtime/router';
export default function ProductLayout() {
  const data = useLoaderData() as { product: string };
  return (
    <section data-testid="scope-product-layout">
      <p>{data.product}</p>
      <Link to="." data-testid="scope-product-link">
        Products
      </Link>
      <Link to="start" data-testid="scope-start-link">
        Open initial station
      </Link>
      <Outlet />
    </section>
  );
}
