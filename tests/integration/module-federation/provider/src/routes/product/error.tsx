import { Link, useRouteError } from '@modern-js/runtime/router';
export default function ProductError() {
  const error = useRouteError() as Error;
  return (
    <section data-testid="scope-error">
      <p>{error.message}</p>
      <Link to="." data-testid="scope-recover-link">
        Return to products
      </Link>
    </section>
  );
}
