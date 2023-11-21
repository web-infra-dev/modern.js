import {
  useFetcher,
  useLoaderData,
  useParams,
} from '@modern-js/runtime/router';

const Page = () => {
  const params = useParams<{
    id: string;
  }>();
  const data = useLoaderData() as string;
  const dataWrap = data && <span className="data-wrapper">{data}</span>;
  const { submit } = useFetcher();
  const handleClick = () => {
    const user = {
      name: 'modern_three_action',
    };
    return submit(user, {
      method: 'post',
      encType: 'application/json',
    });
  };

  return (
    <div>
      <span>item page, param is {params.id}</span>
      <span className="modern-test-name">{dataWrap}</span>
      <div className="action-btn" onClick={handleClick}>
        update
      </div>
    </div>
  );
};

export default Page;
