import { redirect } from '@modern-js/runtime/router';

export const loader = () => {
  return redirect('/user/profile');
};

const Page = () => {
  return <div>redirect</div>;
};

export default Page;
