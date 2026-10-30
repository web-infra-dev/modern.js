import { useLoaderData } from '@modern-js/runtime/router';

export default () => {
  const post = useLoaderData() as { title: string };
  return <h1>POST PAGE: {post.title}</h1>;
};
