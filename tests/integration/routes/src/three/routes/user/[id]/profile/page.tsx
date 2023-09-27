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
  // const submit = useSubmit();
  const handleClick = () => {
    const formData = new FormData();
    formData.append('name', 'modern_three_action');
    return submit(formData, {
      method: 'post',
    });
    // return submit(
    //   { name: 'modern_three_action' },
    //   { method: 'post', encType: 'application/x-www-form-urlencoded' },
    // );
  };

  return (
    <div>
      <span>item page, param is {params.id}</span>
      <span className="modern-test-name">{data}</span>
      <div className="action-btn" onClick={handleClick}>
        update
      </div>
    </div>
  );
};

export default Page;
