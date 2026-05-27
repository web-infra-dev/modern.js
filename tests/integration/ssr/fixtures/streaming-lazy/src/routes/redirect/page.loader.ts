import { defer } from '@modern-js/runtime/router';

export default () => {
  const foo = new Promise<string>(resolve => {
    setTimeout(() => {
      resolve('foo');
    }, 200);
  });

  return defer(
    { data: foo },
    {
      status: 302,
      headers: {
        Location: '/',
      },
    },
  );
};
