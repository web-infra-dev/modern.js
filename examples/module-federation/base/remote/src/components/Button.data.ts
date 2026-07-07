import type { DataFetchParams } from '@module-federation/modern-js-v3/react';

export type Data = {
  data: string;
};

export const fetchData = async (params: DataFetchParams): Promise<Data> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        data: `data: ${new Date()}`,
      });
    }, 500);
  });
};
