import { useLoaderData } from '@modern-js/runtime/router';

export default function Page() {
  useLoaderData();
  return <div className="response-content">Response Page</div>;
}
