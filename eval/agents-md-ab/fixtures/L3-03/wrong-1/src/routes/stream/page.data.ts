import { defer } from 'react-router-dom';

export const loader = () => {
  const slow = new Promise<string>(resolve => {
    setTimeout(() => resolve('deferred-ok'), 500);
  });
  return defer({ slow });
};
