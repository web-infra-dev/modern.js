import { useLoaderData } from '@modern-js/runtime/router';

export default function Layout() {
  const data = useLoaderData() as string;
  return (
    <div>
      <span className="client-loader-page">{`${data}`}</span>
    </div>
  );
}
