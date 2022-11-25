import { useParams } from '@modern-js/runtime/router';

const Page = () => {
  const params = useParams<{
    id: string;
  }>();
  return <div>userid: {params.id}</div>;
};

export default Page;
