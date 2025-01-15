import type { LoaderFunctionArgs } from '@modern-js/runtime/router';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const error = url.searchParams.get('error');

  if (error) {
    return new Response('The user was not found', {
      headers: new Headers({
        'x-error': 'true',
      }),
    });
  } else {
    return {
      name: 'modern.js',
    };
  }
}
