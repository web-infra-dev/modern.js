import {
  Link,
  useLoaderData,
  useLocation,
  useNavigate,
} from '@modern-js/runtime/router';
export default function ProductDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = useLoaderData() as { id: string };
  return (
    <section data-testid="scope-detail">
      <h3>Weather station {data.id}</h3>
      <p data-testid="route-remote-location">
        {location.pathname}
        {location.search}
        {location.hash}
      </p>
      <button
        data-testid="route-remote-next"
        onClick={() =>
          navigate('../43?tab=remote#forecast', { relative: 'path' })
        }
      >
        Next station
      </button>
      <button
        data-testid="route-remote-replace"
        onClick={() =>
          navigate('../44?tab=remote-replace#forecast', {
            relative: 'path',
            replace: true,
          })
        }
      >
        Replace station
      </button>
      <button data-testid="route-remote-back" onClick={() => navigate(-1)}>
        Back
      </button>
      <button
        data-testid="route-remote-slow"
        onClick={() => navigate('../slow', { relative: 'path' })}
      >
        Slow station
      </button>

      <Link data-testid="scope-fail-link" to="?fail=1">
        Fail detail loader
      </Link>
    </section>
  );
}
