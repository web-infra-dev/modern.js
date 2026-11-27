import type { DataFetchParams } from '@module-federation/bridge-react';
export type Data = {
    data: string;
};
export declare const fetchData: (params: DataFetchParams) => Promise<Data>;
