import { Helmet } from '@modern-js/runtime/head';
import { Link, Outlet } from '@modern-js/runtime/router';

export default function Layout() {
  return (
    <div>
      <Helmet>
        <title>Async Helmet Test - Layout</title>
        <meta name="description" content="Test page for react-helmet-async" />
        <link rel="stylesheet" href="/static/css/layout.css" />
      </Helmet>
      Root layout
      <div>
        <Link to="/products" id="products-btn">
          Go Products
        </Link>
      </div>
      <Outlet />
    </div>
  );
}
