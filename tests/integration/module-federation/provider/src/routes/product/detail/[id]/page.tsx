import { Link, useLoaderData } from '@modern-js/runtime/router';
export default function ProductDetail() {
  const data = useLoaderData() as { id: string };
  return (
    <section data-testid="scope-detail">
      <h3>Weather station {data.id}</h3>
      <Link data-testid="scope-fail-link" to="?fail=1">
        Fail detail loader
      </Link>
    </section>
  );
}
