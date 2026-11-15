import { defer } from '@modern-js/runtime/router';
import type { LoaderFunctionArgs } from '@modern-js/runtime/router';

export default ({ params, request }: LoaderFunctionArgs) => {
  const name = params.name!;
  if (new URL(request.url).searchParams.has('deferred')) {
    return defer({
      name,
      ready: new Promise<string>(resolve => {
        setTimeout(() => resolve(name), 80);
      }),
    });
  }
  return { name };
};
