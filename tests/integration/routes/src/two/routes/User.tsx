import { useLoaderData } from '@modern-js/runtime/router';

const User = () => {
  const data = useLoaderData() as { id: string };
  return <div className="two-user">user id: {data.id}</div>;
};

export default User;
