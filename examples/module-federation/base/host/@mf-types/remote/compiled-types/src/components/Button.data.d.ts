import type { DataFetchParams } from '@module-federation/modern-js-v3/react';
export type Data = {
    data: string;
};
export declare const fetchData: (params: DataFetchParams) => Promise<Data>;
