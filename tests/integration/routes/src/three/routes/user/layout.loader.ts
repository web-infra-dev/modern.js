import type { LoaderFunction } from '@modern-js/runtime/router';
import { readFile } from './utils.server';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const loader: LoaderFunction = async ({ request }) => {
  await wait(10);
  // test for support .server.ts
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const content = await readFile(__filename).toString();
  return {
    message: 'user',
  };
};

export default loader;
