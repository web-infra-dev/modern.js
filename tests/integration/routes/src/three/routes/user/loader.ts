import type { LoaderFunction } from '@modern-js/runtime/router';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const loader: LoaderFunction = async ({ request }) => {
  console.log('request user layout', request.url);
  await wait(200);
  return {
    message: 'hello user',
  };
};

export default loader;
