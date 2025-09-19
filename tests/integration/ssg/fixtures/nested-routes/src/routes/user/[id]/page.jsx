import { useLoaderData, useParams } from '@modern-js/runtime/router';

const UserDetail = () => {
  const data = useLoaderData();
  const params = useParams();

  return (
    <div className="text-center">
      <div id="data">{data}</div>
      <div id="params">User ID: {params.id}</div>
    </div>
  );
};

export default UserDetail;
