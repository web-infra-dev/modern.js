import { type ActionFunction, redirect } from '@modern-js/runtime/router';

export const loader = () => {
  return 'request profile page';
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  if (form.get('mode') === 'throw') {
    throw redirect('/user/5678');
  }
  return redirect('/user/1234');
};
