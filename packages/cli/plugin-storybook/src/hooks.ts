import { createAsyncPipeline } from '@modern-js/plugin';

export type Addon =
  | string
  | {
      name: string;
      options?: any;
    };
export const extendInternalAddons = createAsyncPipeline<Addon[], Addon[]>();

export const storybookHooks = {
  extendInternalAddons,
};
