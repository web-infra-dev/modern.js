import { useParams } from '@modern-js/runtime/runtime-router';

const Page = () => {
  const params = useParams<{
    id: string;
  }>();
  return <div>item page, param is {params.id}</div>;
};

export default Page;
