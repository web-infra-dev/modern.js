import { useLoaderData } from '@modern-js/runtime/router';

export default function Page() {
  useLoaderData();

  return (
    <div>
      Error page
      <div>never shown</div>
    </div>
  );
}
