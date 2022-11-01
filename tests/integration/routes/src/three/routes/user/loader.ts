import type { LoaderFunction } from '@modern-js/runtime/router';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const loader: LoaderFunction = async ({ request }) => {
  // eslint-disable-next-line no-console
  console.log('request user layout', request.url);
  await wait(200);
  return 'hello user layout';
};

export default loader;
