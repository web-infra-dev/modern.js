import { useLoaderData } from '@modern-js/runtime/router';

export default function Page() {
  const data = useLoaderData();

  return (
    <div>
      Error page
      <div>never shown</div>;
    </div>
  );
}
