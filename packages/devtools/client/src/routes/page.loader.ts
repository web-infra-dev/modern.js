import { LoaderFunctionArgs, redirect } from '@modern-js/runtime/router';

export default (_args: LoaderFunctionArgs) => {
  return redirect('./overview');
};
