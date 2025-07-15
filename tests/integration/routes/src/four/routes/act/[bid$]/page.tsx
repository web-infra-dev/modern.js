import { useParams } from '@modern-js/runtime/router';

const Page = () => {
  const params = useParams<{
    bid: string;
  }>();
  return <div className="act">act page, param is {params.bid}</div>;
};

export default Page;
