import { type LoaderFunctionArgs, redirect } from '@modern-js/runtime/router';

export default function rootRedirectLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  if (url.searchParams.has('__ssrDirect')) {
    return null;
  }

  return redirect('/home');
}
