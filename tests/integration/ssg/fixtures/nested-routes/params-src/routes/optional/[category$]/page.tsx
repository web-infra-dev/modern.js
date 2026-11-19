import { useLoaderData } from '@modern-js/runtime/router';

export default () => <main>Category: {useLoaderData() as string}</main>;
