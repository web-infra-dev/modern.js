import {
  ShouldRevalidateFunction,
  useLoaderData,
} from '@modern-js/runtime/router';

export const shouldRevalidate: ShouldRevalidateFunction = ({
  nextUrl,
  defaultShouldRevalidate,
}) => {
  const revalidate = nextUrl.searchParams.get('revalidate');
  const flag = revalidate !== 'false';
  if (revalidate) {
    return flag;
  }
  return defaultShouldRevalidate;
};

const Page = () => {
  const params = useLoaderData() as {
    id: string;
  };
  return <div>item page, param is {params.id}</div>;
};

export default Page;
