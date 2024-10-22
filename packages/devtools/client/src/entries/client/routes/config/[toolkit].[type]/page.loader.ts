import { type LoaderFunctionArgs, redirect } from '@modern-js/runtime/router';

export default ({ params }: LoaderFunctionArgs) => {
  if (!params.toolkit || !params.type) {
    return redirect('/404');
  } else if (!['framework', 'builder', 'bundler'].includes(params.toolkit)) {
    return redirect('/404');
  } else if (!['resolved', 'transformed'].includes(params.type)) {
    return redirect('/404');
  } else {
    return null;
  }
};
