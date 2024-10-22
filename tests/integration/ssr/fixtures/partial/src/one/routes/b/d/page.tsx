import { useLoaderData } from '@modern-js/runtime/router';

export default () => {
  const data = useLoaderData() as string;
  return <div className="page-d">{data}</div>;
};
