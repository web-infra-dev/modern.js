import { Link, useLoaderData } from '@modern-js/runtime/router';

export default () => {
  const data = useLoaderData() as string;
  return (
    <div className="page-a">
      {data}
      <Link to="/b">jupmp to B</Link>
    </div>
  );
};
