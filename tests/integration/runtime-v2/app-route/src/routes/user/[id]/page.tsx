import { useParams } from '@modern-js/runtime-v2/router';

const Page = () => {
  const { id } = useParams();
  return <div>User {id}</div>;
};

export default Page;
