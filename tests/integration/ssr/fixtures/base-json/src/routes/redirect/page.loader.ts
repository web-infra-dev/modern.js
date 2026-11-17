import { redirect } from '@modern-js/runtime/router';

export default () => {
  new Promise<string>(resolve => {
    setTimeout(() => {
      resolve('foo');
    }, 200);
  });

  return redirect('/');
};
