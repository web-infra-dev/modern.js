import { useLoaderData } from '@modern-js/runtime/router';

export default () => <main>{useLoaderData() as string}</main>;
