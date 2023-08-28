import { LoaderFunctionArgs, redirect } from '@modern-js/runtime/router';
import { resolveURL } from 'ufo';

export default ({ request }: LoaderFunctionArgs) => {
  const target = resolveURL(request.url, './framework/final-config');
  return redirect(target);
};
