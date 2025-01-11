import { useLoaderData } from '@modern-js/runtime/router';

export default function Page() {
  const data = useLoaderData();
  return <div className="response-content">Response Page</div>;
}
