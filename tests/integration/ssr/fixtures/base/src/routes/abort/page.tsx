import { useLoaderData } from '@modern-js/runtime/router';

export default function Page() {
  const data = useLoaderData() as {
    method: string;
    header: string | null;
    aborted: boolean;
  };

  return (
    <div>{`loader-result:${data.method}:${data.header}:${data.aborted}`}</div>
  );
}
