import { useLoaderData } from '@modern-js/runtime/router';

export default () => <main>File: {useLoaderData() as string}</main>;
