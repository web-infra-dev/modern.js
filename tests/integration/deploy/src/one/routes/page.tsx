import { useLoaderData } from '@modern-js/runtime/router';

const Page = () => {
  const data = useLoaderData() as string;

  return <div id="item">{data}</div>;
};

export default Page;
