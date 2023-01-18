import { redirect } from '@modern-js/runtime/router';

const loader = () => {
  return redirect('/user/profile');
};

export default loader;
