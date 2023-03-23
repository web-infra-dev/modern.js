import { useParams } from '@modern-js/runtime/router';

const Page = () => {
  const params = useParams<{
    ['*']: string;
  }>();

  return (
    <div>
      <div>Dashboard detail page</div>
      <div>params: {params['*']}</div>
    </div>
  );
};

export default Page;
