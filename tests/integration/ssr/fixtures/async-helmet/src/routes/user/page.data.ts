import { defer } from '@modern-js/runtime/router';

export interface UserInfo {
  title: string;
  description: string;
}

export const loader = () =>
  defer({
    userInfo: new Promise(resolve => {
      setTimeout(() => {
        resolve({
          title: 'User - Async Helmet Test',
          description: 'User page for async helmet test',
        });
      }, 500);
    }),
  });
