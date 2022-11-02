import { LoaderFunction } from '@modern-js/runtime/router';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// http://localhost:8081/three/user/profile?_loader=three/user/profile/layout
const loader: LoaderFunction = async () => {
  // return redirect('/user/111');
  await wait(200);
  return 'hello profile layout';
};

export default loader;
