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
  const { submit } = useFetcher();
  const handleClick = () => {
    return submit({ name: 'modern_four_action' }, { method: 'post' });
  };

  return (
    <div>
      <span>item page, param is {params.id}</span>
      <span className="modern-test-name">{data}</span>
      <div className="action-btn" onClick={handleClick}>
        action-button
      </div>
    </div>
  );
};

export default Page;
