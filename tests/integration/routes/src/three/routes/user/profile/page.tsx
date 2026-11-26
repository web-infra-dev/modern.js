import { Form, Outlet, useLoaderData } from '@modern-js/runtime/router';

export default function Page() {
  const data = useLoaderData() as string;
  return (
    <div className="user-profile">
      {data}
      <Form method="post">
        <button name="mode" value="return">
          Return redirect
        </button>
        <button name="mode" value="throw">
          Throw redirect
        </button>
      </Form>
      <Outlet />
    </div>
  );
}
