import { Link, useLoaderData } from '@modern-js/runtime/router';

export default () => {
  const data = useLoaderData() as string;
  return (
    <div>
      {data}
      <Link to="/b">jupmp to B</Link>
    </div>
  );
};
