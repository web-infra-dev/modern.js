import type { LoaderFunction } from '@modern-js/runtime/router';
import { readFile } from './utils.server';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const loader: LoaderFunction = async _args => {
  await wait(10);
  // test for support .server.ts
  await readFile(__filename).toString();
  return {
    message: 'user',
  };
};

export default loader;
