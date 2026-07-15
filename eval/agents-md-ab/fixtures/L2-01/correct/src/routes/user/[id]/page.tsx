import { useLoaderData } from '@modern-js/runtime/router';

const UserPage = () => {
  const data = useLoaderData() as { id: string; name: string };
  return <h1>{data.name}</h1>;
};

export default UserPage;
