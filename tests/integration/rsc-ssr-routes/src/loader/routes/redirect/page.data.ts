import { redirect } from '@modern-js/runtime/router/rsc';

export const loader = () => {
  return redirect('/user');
};
