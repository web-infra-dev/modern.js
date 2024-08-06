import { Link, Outlet, useLoaderData } from '@modern-js/runtime/router';

export default () => {
  const data = useLoaderData() as string;
  return (
    <div id="root_layout">
      {data}
      <Link to="a" className="a-btn">
        jupmp to A
      </Link>
      <Link to="b" className="b-btn">
        jupmp to B
      </Link>
      <Outlet></Outlet>
    </div>
  );
};
