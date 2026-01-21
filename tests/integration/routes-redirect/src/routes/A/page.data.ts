import { redirect } from '@modern-js/runtime/router';

export const loader = ({ request }: { request: Request }) => {
  const isProblem =
    new URL(request.url).searchParams.get('isProblem') === 'true';
  if (isProblem) {
    return redirect('/A?isProblem=false');
  } else {
    return {
      A: {
        aKey3: 'value3',
      },
    };
  }
};
