import { useLoaderData } from '@modern-js/runtime/router';
import type { LoaderFunctionArgs } from '@modern-js/runtime/router';

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id as string;
  return { id, name: `user-${id}` };
};

const UserPage = () => {
  const data = useLoaderData() as { id: string; name: string };
  return <h1>{data.name}</h1>;
};

export default UserPage;
