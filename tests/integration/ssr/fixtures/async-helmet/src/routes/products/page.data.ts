import { defer } from '@modern-js/runtime/router';

export interface ProductInfo {
  title: string;
  description: string;
}

export const loader = () =>
  defer({
    productInfo: new Promise(resolve => {
      setTimeout(() => {
        resolve({
          title: 'Products - Async Helmet Test',
          description: 'Products page for async helmet test',
        });
      }, 500);
    }),
  });
