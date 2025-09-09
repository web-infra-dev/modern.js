import { redirect } from '@modern-js/runtime/router';

export const loader = () => {
  return redirect('/user');
};
