import { useLoaderData } from '@modern-js/runtime/router';

export default function Page() {
  const data = useLoaderData() as string;

  return <div className="error-loader-page">{data}</div>;
}
