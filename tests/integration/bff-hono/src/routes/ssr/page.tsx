import { useLoaderData } from '@modern-js/runtime/router';
import type { ProfileData } from './page.data';

const Page = () => {
  const data = useLoaderData() as ProfileData;
  const { message = 'bff-hono' } = data || {};
  return <div className="hello">{message}</div>;
};

export default Page;
