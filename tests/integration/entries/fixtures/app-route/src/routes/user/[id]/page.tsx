import { useParams } from '@modern-js/runtime/router';

const Page = () => {
  const { id } = useParams();
  return <div>User {id}</div>;
};

export default Page;
