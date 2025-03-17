import type { LoaderFunctionArgs } from '@modern-js/runtime/router';

export const loader = ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const responseType = url.searchParams.get('type') as string;
  const statusCode = url.searchParams.get('code') as string;

  if (responseType === 'throw_error') {
    throw new Error("can't found the user");
  }

  if (responseType === 'throw_response') {
    throw new Response(
      JSON.stringify({
        message: "can't found the user",
      }),
      {
        status: Number(statusCode),
      },
    );
  }

  if (responseType === 'return_response') {
    return new Response(
      JSON.stringify({
        message: 'user modern.js',
      }),
      {
        status: Number(statusCode),
      },
    );
  }

  return null;
};
