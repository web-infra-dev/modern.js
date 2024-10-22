import { Link, useLoaderData } from '@modern-js/runtime/router';

export default () => {
  const data = useLoaderData() as string;
  return (
    <div className="page-b">
      {data}
      <Link to="/a">jupmp to A</Link>
    </div>
  );
};
