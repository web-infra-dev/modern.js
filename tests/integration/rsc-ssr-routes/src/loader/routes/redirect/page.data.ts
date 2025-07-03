import { redirect } from '@modern-js/runtime/router/server';

export const loader = () => {
  return redirect('/user');
};
